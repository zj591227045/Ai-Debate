/**
 * Deepseek供应商实现
 */

import { ModelProvider } from '../../types/providers';
import { Message, ModelParameters, ModelResponse, ModelError, ModelCapabilities } from '../../types/common';
import { ApiConfig } from '../../types/config';
import { ModelErrorHandler } from '../../utils/error-handler';
import { ModelRateLimiter } from '../../utils/rate-limiter';
import { ModelTokenCounter } from '../../utils/token-counter';
import {
  DeepseekConfig,
  DeepseekResponse,
  DeepseekStreamResponse,
  DeepseekError,
  DeepseekRequestParams,
  DeepseekProviderSpecific,
} from './types';

type ErrorType = ModelError['type'];

export class DeepseekProvider implements ModelProvider {
  private config!: DeepseekConfig;
  private errorHandler: ModelErrorHandler;
  private rateLimiter: ModelRateLimiter;
  private tokenCounter: ModelTokenCounter;
  private baseURL: string;

  constructor() {
    this.errorHandler = new ModelErrorHandler();
    this.rateLimiter = new ModelRateLimiter();
    this.tokenCounter = new ModelTokenCounter(128000); // Deepseek-67B 支持更大的上下文窗口
    this.baseURL = 'https://api.deepseek.com/v1';
  }

  async initialize(config: ApiConfig): Promise<void> {
    // 先检查 providerSpecific 是否存在
    if (!config.providerSpecific?.deepseek) {
      throw new Error('缺少 Deepseek 配置');
    }

    // 安全地转换类型
    const deepseekConfig = config.providerSpecific.deepseek as unknown as DeepseekProviderSpecific;
    
    // 验证必要的配置
    if (!deepseekConfig.model) {
      throw new Error('缺少 Deepseek 模型配置');
    }

    this.config = {
      apiKey: config.apiKey,
      organization: config.organizationId,
      baseURL: config.endpoint || this.baseURL,
      defaultModel: deepseekConfig.model,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    };

    console.log('Deepseek provider 初始化完成，使用模型:', deepseekConfig.model);
  }

  getCapabilities(): ModelCapabilities {
    return {
      streaming: true,
      functionCalling: true,
      maxContextTokens: 128000,
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
      const response = await this.makeRequest<DeepseekResponse>('/chat/completions', params);
      
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
        headers: this.getHeaders(),
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
              const response = JSON.parse(data) as DeepseekStreamResponse;
              
              if (!response.choices?.[0]?.delta?.content) continue;
              
              yield this.convertStreamResponse(response);
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
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    };

    if (this.config.organization) {
      headers['Deepseek-Organization'] = this.config.organization;
    }

    return headers;
  }

  private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.config.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
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
  ): DeepseekRequestParams {
    const model = this.config.defaultModel;
    console.log('Deepseek prepareRequestParams - 使用的模型:', model);

    return {
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: parameters?.temperature,
      top_p: parameters?.topP,
      max_tokens: parameters?.maxTokens,
      stream,
    };
  }

  private convertResponse(response: DeepseekResponse): ModelResponse {
    return {
      content: response.choices[0].message.content,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: response.choices[0].finish_reason,
      },
    };
  }

  private convertStreamResponse(response: DeepseekStreamResponse): ModelResponse {
    return {
      content: response.choices[0].delta.content || '',
      usage: {
        promptTokens: 0,
        completionTokens: this.countTokens(response.choices[0].delta.content || ''),
        totalTokens: this.countTokens(response.choices[0].delta.content || ''),
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: response.choices[0].finish_reason || 'stop',
      },
    };
  }

  private async handleResponseError(response: Response): Promise<Error & ModelError> {
    try {
      const error = await response.json() as DeepseekError;
      return this.createError(
        this.mapErrorType(error.error.type),
        error.error.message
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

  private mapErrorType(type: string): ErrorType {
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
    // Deepseek目前提供固定的模型列表
    return [
      'deepseek-chat',
      'deepseek-coder',
      'deepseek-math'
    ];
  }
}
