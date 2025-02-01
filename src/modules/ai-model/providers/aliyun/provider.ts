/**
 * 通义千问供应商实现
 */

import { ModelProvider } from '../../types/providers';
import { Message, ModelParameters, ModelResponse, ModelError, ModelCapabilities } from '../../types/common';
import { ApiConfig } from '../../types/config';
import { ModelErrorHandler } from '../../utils/error-handler';
import { ModelRateLimiter } from '../../utils/rate-limiter';
import { ModelTokenCounter } from '../../utils/token-counter';
import {
  AliyunConfig,
  AliyunResponse,
  AliyunStreamResponse,
  AliyunError,
  AliyunRequestParams,
  AliyunAuthParams,
} from './types';
import * as crypto from 'crypto';

export class AliyunProvider implements ModelProvider {
  private config!: AliyunConfig;
  private errorHandler: ModelErrorHandler;
  private rateLimiter: ModelRateLimiter;
  private tokenCounter: ModelTokenCounter;
  private baseURL: string;

  constructor() {
    this.errorHandler = new ModelErrorHandler();
    this.rateLimiter = new ModelRateLimiter();
    this.tokenCounter = new ModelTokenCounter(32000); // 通义千问的上下文窗口
    this.baseURL = 'https://dashscope.aliyuncs.com/api/v1';
  }

  async initialize(config: ApiConfig): Promise<void> {
    if (!config.providerSpecific?.aliyun) {
      throw new Error('缺少通义千问所需的配置参数');
    }

    const aliyunConfig = config.providerSpecific.aliyun;
    
    this.config = {
      apiKey: config.apiKey,
      accessKeyId: aliyunConfig.accessKeyId,
      accessKeySecret: aliyunConfig.accessKeySecret,
      baseURL: config.endpoint || this.baseURL,
      defaultModel: 'qwen-turbo',
      region: aliyunConfig.region,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    };
  }

  getCapabilities(): ModelCapabilities {
    return {
      streaming: true,
      functionCalling: true,
      maxContextTokens: 32000,
      maxResponseTokens: 4096,
      multipleCompletions: false,
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
      const response = await this.makeRequest<AliyunResponse>('/chat/completions', params);
      
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
              const streamResponse = JSON.parse(data) as AliyunStreamResponse;
              
              if (!streamResponse.output?.text) continue;
              
              yield this.convertStreamResponse(streamResponse);
              
              if (streamResponse.output.finish_reason) {
                return;
              }
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
    const timestamp = new Date().toISOString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const signature = await this.generateSignature({
      method: 'POST',
      path: '/chat/completions',
      headers: {
        'x-acs-date': timestamp,
        'x-acs-nonce': nonce,
      },
      accessKeyId: this.config.accessKeyId,
      accessKeySecret: this.config.accessKeySecret,
    });

    return {
      'Content-Type': 'application/json',
      'Authorization': `acs ${this.config.accessKeyId}:${signature}`,
      'x-acs-date': timestamp,
      'x-acs-nonce': nonce,
      'x-acs-region': this.config.region,
      'x-dashscope-api-key': this.config.apiKey,
    };
  }

  private async generateSignature(params: AliyunAuthParams): Promise<string> {
    const { method, path, headers, accessKeyId, accessKeySecret } = params;
    const timestamp = headers['x-acs-date'];
    const nonce = headers['x-acs-nonce'];
    
    const canonicalString = [
      method,
      path,
      '',
      `x-acs-date:${timestamp}`,
      `x-acs-nonce:${nonce}`,
      '',
    ].join('\n');
    
    const hmac = crypto.createHmac('sha256', accessKeySecret);
    hmac.update(canonicalString);
    return hmac.digest('base64');
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
  ): AliyunRequestParams {
    return {
      model: this.config.defaultModel,
      input: {
        messages: messages.map(msg => ({
          role: this.mapRole(msg.role),
          content: msg.content,
        })),
      },
      parameters: {
        temperature: parameters?.temperature,
        top_p: parameters?.topP,
        max_tokens: parameters?.maxTokens,
        stop: parameters?.stop,
        stream,
        result_format: 'text',
      },
    };
  }

  private mapRole(role: string): string {
    switch (role) {
      case 'system':
        return 'system';
      case 'assistant':
        return 'assistant';
      case 'user':
      default:
        return 'user';
    }
  }

  private convertResponse(response: AliyunResponse): ModelResponse {
    return {
      content: response.output.text,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.total_tokens,
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: response.output.finish_reason,
      },
    };
  }

  private convertStreamResponse(response: AliyunStreamResponse): ModelResponse {
    return {
      content: response.output.text,
      usage: {
        promptTokens: 0,
        completionTokens: this.countTokens(response.output.text),
        totalTokens: this.countTokens(response.output.text),
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: response.output.finish_reason || 'length',
      },
    };
  }

  private async handleResponseError(response: Response): Promise<Error & ModelError> {
    try {
      const error = await response.json() as AliyunError;
      return this.createError(
        this.mapErrorType(error.code),
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
      case 'InvalidAccessKeyId':
      case 'SignatureDoesNotMatch':
        return 'auth';
      case 'Throttling':
      case 'RequestLimitExceeded':
        return 'rate_limit';
      case 'InvalidParameter':
      case 'MissingParameter':
        return 'invalid_request';
      case 'ServiceUnavailable':
      case 'InternalError':
        return 'server';
      case 'ReadTimeout':
        return 'timeout';
      default:
        return 'unknown';
    }
  }
} 