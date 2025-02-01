/**
 * Anthropic供应商实现
 */

import { ModelProvider } from '../../types/providers';
import { Message, ModelParameters, ModelResponse, ModelError, ModelCapabilities } from '../../types/common';
import { ApiConfig } from '../../types/config';
import { ModelErrorHandler } from '../../utils/error-handler';
import { ModelRateLimiter } from '../../utils/rate-limiter';
import { ModelTokenCounter } from '../../utils/token-counter';
import {
  AnthropicConfig,
  AnthropicResponse,
  AnthropicStreamResponse,
  AnthropicError,
  AnthropicRequestParams,
} from './types';

type ErrorType = ModelError['type'];

export class AnthropicProvider implements ModelProvider {
  private config!: AnthropicConfig;
  private errorHandler: ModelErrorHandler;
  private rateLimiter: ModelRateLimiter;
  private tokenCounter: ModelTokenCounter;
  private baseURL: string;

  constructor() {
    this.errorHandler = new ModelErrorHandler();
    this.rateLimiter = new ModelRateLimiter();
    this.tokenCounter = new ModelTokenCounter(100000); // Claude-3 的上下文窗口更大
    this.baseURL = 'https://api.anthropic.com/v1';
  }

  async initialize(config: ApiConfig): Promise<void> {
    this.config = {
      apiKey: config.apiKey,
      baseURL: config.endpoint || this.baseURL,
      defaultModel: 'claude-3-opus',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      version: '2024-03-10'  // Anthropic API 版本
    };
  }

  getCapabilities(): ModelCapabilities {
    return {
      streaming: true,
      functionCalling: true,
      maxContextTokens: 100000,  // Claude-3 的上下文窗口
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
        throw this.createError('rate_limit', 'Rate limit exceeded');
      }

      const params = this.prepareRequestParams(messages, parameters);
      const response = await this.makeRequest<AnthropicResponse>('/messages', params);
      
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
        throw this.createError('rate_limit', 'Rate limit exceeded');
      }

      const params = this.prepareRequestParams(messages, parameters, true);
      const response = await fetch(`${this.config.baseURL}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw await this.handleResponseError(response);
      }

      if (!response.body) {
        throw this.createError('server', 'Response body is null');
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
              const response = JSON.parse(data) as AnthropicStreamResponse;
              
              if (!response.delta?.text) continue;
              
              yield this.convertStreamResponse(response);
            } catch (e) {
              console.warn('Error parsing SSE message:', e);
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
    return {
      'Content-Type': 'application/json',
      'X-Api-Key': this.config.apiKey,
      'anthropic-version': this.config.version!,
    };
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
  ): AnthropicRequestParams {
    return {
      model: this.config.defaultModel,
      messages: messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
      max_tokens: parameters?.maxTokens,
      temperature: parameters?.temperature,
      top_p: parameters?.topP,
      stream,
      system: messages.find(m => m.role === 'system')?.content,
    };
  }

  private convertResponse(response: AnthropicResponse): ModelResponse {
    return {
      content: response.content,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: response.stop_reason,
      },
    };
  }

  private convertStreamResponse(response: AnthropicStreamResponse): ModelResponse {
    return {
      content: response.delta.text,
      usage: {
        promptTokens: 0,
        completionTokens: this.countTokens(response.delta.text),
        totalTokens: this.countTokens(response.delta.text),
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: response.stop_reason || '',
      },
    };
  }

  private async handleResponseError(response: Response): Promise<Error & ModelError> {
    try {
      const error = await response.json() as AnthropicError;
      return this.createError(
        this.mapErrorType(error.type),
        error.message
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
    const error = new Error(message) as Error & ModelError;
    error.name = 'ModelError';
    error.code = type;
    error.type = this.mapErrorType(type);
    error.retryable = type === 'rate_limit' || type === 'server';
    return error;
  }

  private mapErrorType(type: string): ErrorType {
    switch (type) {
      case 'rate_limit_error':
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
} 