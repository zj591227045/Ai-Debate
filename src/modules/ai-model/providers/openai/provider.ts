/**
 * OpenAI供应商实现
 */

import { ModelProvider } from '../../types/providers';
import { Message, ModelParameters, ModelResponse, ModelError, ModelCapabilities } from '../../types/common';
import { ApiConfig } from '../../types/config';
import { ModelErrorHandler } from '../../utils/error-handler';
import { ModelRateLimiter } from '../../utils/rate-limiter';
import { ModelTokenCounter } from '../../utils/token-counter';
import {
  OpenAIConfig,
  OpenAIResponse,
  OpenAIStreamResponse,
  OpenAIError,
  OpenAIRequestParams,
} from './types';

type ErrorType = ModelError['type'];

export class OpenAIProvider implements ModelProvider {
  private config!: OpenAIConfig;  // 使用 ! 断言操作符，因为我们在 initialize 方法中一定会初始化它
  private errorHandler: ModelErrorHandler;
  private rateLimiter: ModelRateLimiter;
  private tokenCounter: ModelTokenCounter;
  private baseURL: string;

  constructor() {
    this.errorHandler = new ModelErrorHandler();
    this.rateLimiter = new ModelRateLimiter();
    this.tokenCounter = new ModelTokenCounter();
    this.baseURL = 'https://api.openai.com/v1';
  }

  async initialize(config: ApiConfig): Promise<void> {
    this.config = {
      apiKey: config.apiKey,
      organization: config.organizationId,
      baseURL: config.endpoint || this.baseURL,
      defaultModel: 'gpt-3.5-turbo',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    };
  }

  getCapabilities(): ModelCapabilities {
    return {
      streaming: true,
      functionCalling: true,
      maxContextTokens: 4096,
      maxResponseTokens: 2048,
      multipleCompletions: true,
    };
  }

  async generateCompletion(
    messages: Message[],
    parameters?: ModelParameters
  ): Promise<ModelResponse> {
    try {
      // 检查速率限制
      if (!this.rateLimiter.canMakeRequest()) {
        throw this.createError('rate_limit', 'Rate limit exceeded');
      }

      // 准备请求参数
      const params = this.prepareRequestParams(messages, parameters);

      // 发送请求
      const response = await this.makeRequest<OpenAIResponse>('/chat/completions', params);

      // 记录Token使用量
      this.rateLimiter.recordRequest(response.usage.total_tokens);

      // 转换响应格式
      return this.convertResponse(response);
    } catch (error) {
      // 处理错误
      const modelError = this.handleError(error);
      throw modelError;
    }
  }

  async *generateCompletionStream(
    messages: Message[],
    parameters?: ModelParameters
  ): AsyncGenerator<ModelResponse> {
    try {
      // 检查速率限制
      if (!this.rateLimiter.canMakeRequest()) {
        throw this.createError('rate_limit', 'Rate limit exceeded');
      }

      // 准备请求参数
      const params = this.prepareRequestParams(messages, parameters, true);

      // 创建流式请求
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw await this.handleResponseError(response);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to create stream reader');
      }

      let accumulatedTokens = 0;
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
            if (line.trim() === 'data: [DONE]') return;

            try {
              const data = JSON.parse(line.replace(/^data: /, ''));
              const streamResponse = data as OpenAIStreamResponse;
              const partialResponse = this.convertStreamResponse(streamResponse);
              
              // 估算并累计Token使用量
              if (partialResponse.content) {
                const tokens = this.tokenCounter.countTextTokens(partialResponse.content);
                accumulatedTokens += tokens;
              }
              
              yield partialResponse;
            } catch (e) {
              console.warn('Failed to parse stream data:', e);
              continue;
            }
          }
        }
      } finally {
        reader.releaseLock();
        // 记录累计的Token使用量
        this.rateLimiter.recordRequest(accumulatedTokens);
      }
    } catch (error) {
      // 处理错误
      const modelError = this.handleError(error);
      throw modelError;
    }
  }

  countTokens(text: string): number {
    return this.tokenCounter.countTextTokens(text);
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // 尝试获取模型列表来验证API密钥
      const response = await fetch(`${this.config.baseURL}/models`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API key validation failed');
      }

      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    };

    if (this.config.organization) {
      headers['OpenAI-Organization'] = this.config.organization;
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
  ): OpenAIRequestParams {
    const model = this.config.defaultModel;
    if (!model) {
      throw this.createError('configuration_error', 'Default model is not configured');
    }
    
    return {
      model,
      messages: messages,
      temperature: parameters?.temperature ?? 0.7,
      top_p: parameters?.topP ?? 1,
      max_tokens: parameters?.maxTokens,
      presence_penalty: parameters?.presencePenalty,
      frequency_penalty: parameters?.frequencyPenalty,
      stream,
    };
  }

  private convertResponse(response: OpenAIResponse): ModelResponse {
    const choice = response.choices[0];
    if (!this.config.defaultModel) {
      throw this.createError('configuration_error', 'Default model is not configured');
    }
    return {
      content: choice.message.content,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: choice.finish_reason || 'stop',
      },
    };
  }

  private convertStreamResponse(response: OpenAIStreamResponse): ModelResponse {
    const choice = response.choices[0];
    if (!this.config.defaultModel) {
      throw this.createError('configuration_error', 'Default model is not configured');
    }
    return {
      content: choice.delta.content || '',
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: choice.finish_reason || 'length',
      },
    };
  }

  private async handleResponseError(response: Response): Promise<Error & ModelError> {
    try {
      const error = await response.json() as OpenAIError;
      return this.createError(
        this.mapErrorType(error.error.type),
        error.error.message
      );
    } catch {
      return this.createError(
        'unknown',
        `HTTP error ${response.status}: ${response.statusText}`
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
    const error = new Error(message);
    const errorType = this.mapErrorType(type);
    return Object.assign(error, {
      code: type,
      retryable: errorType === 'rate_limit' || errorType === 'server',
      type: errorType
    });
  }

  private mapErrorType(type: string): ModelError['type'] {
    switch (type) {
      case 'insufficient_quota':
      case 'rate_limit_exceeded':
      case 'rate_limit':
        return 'rate_limit';
      case 'invalid_request_error':
        return 'invalid_request';
      case 'invalid_api_key':
        return 'auth';
      case 'server_error':
      case 'server':
        return 'server';
      case 'timeout':
        return 'timeout';
      default:
        return 'unknown';
    }
  }
} 
