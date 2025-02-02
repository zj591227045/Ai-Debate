/**
 * Volcengine供应商实现
 */

import { ModelProvider } from '../../types/providers';
import { Message, ModelParameters, ModelResponse, ModelError, ModelCapabilities } from '../../types/common';
import { ApiConfig } from '../../types/config';
import { ModelErrorHandler } from '../../utils/error-handler';
import { ModelRateLimiter } from '../../utils/rate-limiter';
import { ModelTokenCounter } from '../../utils/token-counter';
import {
  VolcengineConfig,
  VolcengineResponse,
  VolcengineStreamResponse,
  VolcengineError,
  VolcengineRequestParams,
} from './types';

export class VolcengineProvider implements ModelProvider {
  private config!: VolcengineConfig;
  private errorHandler: ModelErrorHandler;
  private rateLimiter: ModelRateLimiter;
  private tokenCounter: ModelTokenCounter;
  private baseURL: string;

  constructor() {
    this.errorHandler = new ModelErrorHandler();
    this.rateLimiter = new ModelRateLimiter();
    this.tokenCounter = new ModelTokenCounter(32000); // Volcengine的上下文窗口
    this.baseURL = 'https://api.volcengine.com/v1';
  }

  async initialize(config: ApiConfig): Promise<void> {
    if (!config.providerSpecific?.volcengine) {
      throw new Error('缺少火山引擎所需的配置参数');
    }

    const volcengineConfig = config.providerSpecific.volcengine;
    
    this.config = {
      apiKey: config.apiKey,
      secretKey: config.secretKey || '',
      baseURL: config.endpoint || this.baseURL,
      defaultModel: 'chatglm-130b',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      region: volcengineConfig.region,
      projectId: volcengineConfig.projectId,
    };
  }

  getCapabilities(): ModelCapabilities {
    return {
      streaming: true,
      functionCalling: true,
      maxContextTokens: 32000,
      maxResponseTokens: 4096,
      multipleCompletions: true,
    };
  }

  async generateCompletion(
    messages: Message[],
    parameters?: ModelParameters
  ): Promise<ModelResponse> {
    try {
      if (!this.rateLimiter.canMakeRequest()) {
        throw this.createError('rate_limit', '已超过速率限制');
      }

      const params = this.prepareRequestParams(messages, parameters);
      const response = await this.makeRequest<VolcengineResponse>('/chat/completions', params);
      
      const modelResponse = this.convertResponse(response);
      this.rateLimiter.recordRequest(modelResponse.usage.totalTokens);
      
      return modelResponse;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  async *generateCompletionStream(
    messages: Message[],
    parameters?: ModelParameters
  ): AsyncGenerator<ModelResponse> {
    try {
      if (!this.rateLimiter.canMakeRequest()) {
        throw this.createError('rate_limit', '已超过速率限制');
      }

      const params = this.prepareRequestParams(messages, parameters, true);
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw await this.handleResponseError(response);
      }

      if (!response.body) {
        throw this.createError('server', '响应体为空');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line === 'data: [DONE]') return;

            try {
              const data = line.replace(/^data: /, '');
              const streamResponse = JSON.parse(data) as VolcengineStreamResponse;
              
              if (!streamResponse.data?.output?.text) continue;
              
              yield this.convertStreamResponse(streamResponse);
            } catch (e) {
              console.warn('解析SSE消息出错:', e);
              continue;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  countTokens(text: string): number {
    return this.tokenCounter.countTextTokens(text);
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseURL}/models`, {
        headers: await this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async getHeaders(): Promise<HeadersInit> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await this.generateSignature(timestamp);

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-Date': timestamp.toString(),
      'X-Signature': signature,
      'X-Region': this.config.region,
    };
  }

  private async generateSignature(timestamp: number): Promise<string> {
    const message = `${this.config.apiKey}:${timestamp}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const key = encoder.encode(this.config.secretKey);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      data
    );
    
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.config.baseURL}${endpoint}`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await this.handleResponseError(response);
    }

    return response.json();
  }

  private prepareRequestParams(
    messages: Message[],
    parameters?: ModelParameters,
    stream: boolean = false
  ): VolcengineRequestParams {
    return {
      model: {
        name: this.config.defaultModel,
      },
      parameters: {
        temperature: parameters?.temperature,
        top_p: parameters?.topP,
        max_new_tokens: parameters?.maxTokens,
        stream,
      },
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    };
  }

  private convertResponse(response: VolcengineResponse): ModelResponse {
    return {
      content: response.data.output.text,
      usage: {
        promptTokens: response.data.usage.input_tokens,
        completionTokens: response.data.usage.output_tokens,
        totalTokens: response.data.usage.total_tokens,
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: 'stop',
      },
    };
  }

  private convertStreamResponse(response: VolcengineStreamResponse): ModelResponse {
    return {
      content: response.data.output.text,
      usage: {
        promptTokens: 0,
        completionTokens: response.data.output.tokens,
        totalTokens: response.data.output.tokens,
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: response.data.is_end ? 'stop' : 'length',
      },
    };
  }

  private async handleResponseError(response: Response): Promise<Error & ModelError> {
    try {
      const error = await response.json() as VolcengineError;
      return this.createError(
        this.mapErrorType(error.code.toString()),
        error.message
      );
    } catch {
      return this.createError(
        'unknown',
        `HTTP错误 ${response.status}: ${response.statusText}`
      );
    }
  }

  private handleError(error: unknown): Error & ModelError {
    if (error instanceof Error) {
      if ('type' in error && typeof (error as any).type === 'string') {
        const modelError = error as Error & ModelError;
        if (!modelError.code) {
          modelError.code = modelError.type;
        }
        if (modelError.retryable === undefined) {
          modelError.retryable = modelError.type === 'rate_limit' || modelError.type === 'server';
        }
        return modelError;
      }
      return this.createError('unknown', error.message);
    }
    return this.createError('unknown', String(error));
  }

  private createError(type: string, message: string): Error & ModelError {
    const error = new Error(message) as Error & ModelError;
    error.name = 'ModelError';
    error.code = type;
    error.type = this.mapErrorType(type);
    error.retryable = type === 'rate_limit' || type === 'server';
    return error;
  }

  private mapErrorType(type: string): ModelError['type'] {
    switch (type) {
      case 'rate_limit_exceeded':
        return 'rate_limit';
      case 'invalid_request_error':
        return 'invalid_request';
      case 'authentication_error':
        return 'auth';
      case 'server_error':
        return 'server';
      case 'timeout':
        return 'timeout';
      default:
        return 'unknown';
    }
  }

  async listModels(): Promise<string[]> {
    // 火山引擎目前提供固定的模型列表
    return [
      'skylark-lite',
      'skylark-plus',
      'skylark-pro',
      'skylark-max'
    ];
  }
}

