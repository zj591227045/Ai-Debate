/**
 * LocalAI供应商实现
 */

import {
  Message,
  ModelParameters,
  ModelResponse,
  ModelError,
  ModelCapabilities,
} from '../../types/common';
import { ModelProvider } from '../../types/providers';
import { ApiConfig } from '../../types/config';
import { ModelErrorHandler } from '../../utils/error-handler';
import { ModelRateLimiter } from '../../utils/rate-limiter';
import { ModelTokenCounter } from '../../utils/token-counter';
import {
  LocalAIConfig,
  LocalAIResponse,
  LocalAIStreamResponse,
  LocalAIError,
  LocalAIRequestParams,
} from './types';

export class LocalAIProvider implements ModelProvider {
  private config!: LocalAIConfig;
  private errorHandler: ModelErrorHandler;
  private rateLimiter: ModelRateLimiter;
  private tokenCounter: ModelTokenCounter;
  private initialized: boolean = false;

  constructor() {
    this.errorHandler = new ModelErrorHandler();
    this.rateLimiter = new ModelRateLimiter();
    this.tokenCounter = new ModelTokenCounter(8192); // LocalAI 默认上下文窗口
  }

  async initialize(config: ApiConfig): Promise<void> {
    if (!config.providerSpecific?.localai?.model) {
      throw new Error('Model name is required for LocalAI');
    }

    this.config = {
      baseURL: config.endpoint || 'http://localhost:8080/v1',
      defaultModel: config.providerSpecific.localai.model,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      options: config.providerSpecific.localai.options,
    };

    this.initialized = true;
  }

  getCapabilities(): ModelCapabilities {
    return {
      streaming: true,
      functionCalling: false,
      maxContextTokens: 8192,
      maxResponseTokens: 2048,
      multipleCompletions: false,
    };
  }

  async generateCompletion(
    messages: Message[],
    parameters?: ModelParameters
  ): Promise<ModelResponse> {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    if (!this.rateLimiter.canMakeRequest()) {
      throw this.createError('rate_limit', 'Rate limit exceeded');
    }

    try {
      const requestParams = this.prepareRequestParameters(messages, parameters);
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestParams),
      });

      if (!response.ok) {
        const error = await this.handleResponseError(response);
        throw error;
      }

      const result = await response.json() as LocalAIResponse;
      const modelResponse = this.convertResponse(result);
      this.rateLimiter.recordRequest(modelResponse.usage.totalTokens);
      return modelResponse;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async *generateCompletionStream(
    messages: Message[],
    parameters?: ModelParameters
  ): AsyncGenerator<ModelResponse> {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    if (!this.rateLimiter.canMakeRequest()) {
      throw this.createError('rate_limit', 'Rate limit exceeded');
    }

    try {
      const requestParams = this.prepareRequestParameters(messages, parameters, true);
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestParams),
      });

      if (!response.ok) {
        const error = await this.handleResponseError(response);
        throw error;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk
          .split('\n')
          .filter(line => line.trim().startsWith('data: '))
          .map(line => line.replace('data: ', '').trim());

        for (const line of lines) {
          if (line === '[DONE]') break;
          const streamResponse = JSON.parse(line) as LocalAIStreamResponse;
          const modelResponse = this.convertStreamResponse(streamResponse);
          this.rateLimiter.recordRequest(1); // 每个token记录一次
          yield modelResponse;
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private prepareRequestParameters(
    messages: Message[],
    parameters?: ModelParameters,
    stream: boolean = false
  ): LocalAIRequestParams {
    return {
      model: this.config.defaultModel,
      messages: messages.map(msg => ({
        role: this.mapRole(msg.role),
        content: msg.content,
      })),
      stream,
      temperature: parameters?.temperature,
      top_p: parameters?.topP,
      presence_penalty: parameters?.presencePenalty,
      frequency_penalty: parameters?.frequencyPenalty,
      max_tokens: parameters?.maxTokens,
      stop: parameters?.stop,
      ...this.config.options,
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

  private convertResponse(response: LocalAIResponse): ModelResponse {
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

  private convertStreamResponse(response: LocalAIStreamResponse): ModelResponse {
    const content = response.choices[0].delta.content || '';
    return {
      content,
      usage: {
        promptTokens: 0,
        completionTokens: 1,
        totalTokens: 1,
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: response.choices[0].finish_reason || 'length',
      },
    };
  }

  countTokens(text: string): number {
    return this.tokenCounter.countTextTokens(text);
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseURL}/models`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private async handleResponseError(response: Response): Promise<Error & ModelError> {
    try {
      const error = await response.json() as LocalAIError;
      return this.createError(
        error.error.type || 'unknown',
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

  private mapErrorType(type: string): ModelError['type'] {
    switch (type) {
      case 'rate_limit':
        return 'rate_limit';
      case 'invalid_request':
        return 'invalid_request';
      case 'auth':
        return 'auth';
      case 'server':
        return 'server';
      case 'timeout':
        return 'timeout';
      default:
        return 'unknown';
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseURL}/models`);
      if (!response.ok) {
        throw await this.handleResponseError(response);
      }
      const data = await response.json();
      return data.map((model: { id: string }) => model.id);
    } catch (error) {
      throw this.handleError(error);
    }
  }
} 