/**
 * Ollama供应商实现
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
  OllamaConfig,
  OllamaResponse,
  OllamaStreamResponse,
  OllamaError,
  OllamaRequestParams,
} from './types';

export class OllamaProvider implements ModelProvider {
  private config!: OllamaConfig;
  private errorHandler: ModelErrorHandler;
  private rateLimiter: ModelRateLimiter;
  private tokenCounter: ModelTokenCounter;
  private initialized: boolean = false;

  constructor() {
    this.errorHandler = new ModelErrorHandler();
    this.rateLimiter = new ModelRateLimiter();
    this.tokenCounter = new ModelTokenCounter(32768); // Ollama 默认上下文窗口
  }

  async initialize(config: ApiConfig): Promise<void> {
    if (!config.providerSpecific?.ollama?.model) {
      throw new Error('Model name is required for Ollama');
    }

    this.config = {
      baseURL: config.endpoint || 'http://localhost:11434',
      defaultModel: config.providerSpecific.ollama.model,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      options: config.providerSpecific.ollama.options,
    };

    this.initialized = true;
  }

  getCapabilities(): ModelCapabilities {
    return {
      streaming: true,
      functionCalling: false,
      maxContextTokens: 32768,
      maxResponseTokens: 4096,
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
      const response = await fetch(`${this.config.baseURL}/api/generate`, {
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

      const result = await response.json() as OllamaResponse;
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
      const response = await fetch(`${this.config.baseURL}/api/generate`, {
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
        const streamResponse = JSON.parse(chunk) as OllamaStreamResponse;

        const modelResponse = this.convertStreamResponse(streamResponse);
        this.rateLimiter.recordRequest(1); // 每个token记录一次
        yield modelResponse;

        if (streamResponse.done) break;
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private prepareRequestParameters(
    messages: Message[],
    parameters?: ModelParameters,
    stream: boolean = false
  ): OllamaRequestParams {
    const lastMessage = messages[messages.length - 1];
    return {
      model: this.config.defaultModel,
      prompt: lastMessage.content,
      stream,
      context: this.config.context,
      options: {
        temperature: parameters?.temperature,
        top_p: parameters?.topP,
        repeat_penalty: parameters?.frequencyPenalty,
        stop: parameters?.stop,
        num_predict: parameters?.maxTokens,
        ...this.config.options,
      },
    };
  }

  private convertResponse(response: OllamaResponse): ModelResponse {
    return {
      content: response.response,
      usage: {
        promptTokens: response.prompt_tokens || 0,
        completionTokens: response.completion_tokens || 0,
        totalTokens: (response.prompt_tokens || 0) + (response.completion_tokens || 0),
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: response.done ? 'stop' : 'length',
      },
    };
  }

  private convertStreamResponse(response: OllamaStreamResponse): ModelResponse {
    return {
      content: response.response,
      usage: {
        promptTokens: 0,
        completionTokens: 1,
        totalTokens: 1,
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: response.done ? 'stop' : 'length',
      },
    };
  }

  countTokens(text: string): number {
    return this.tokenCounter.countTextTokens(text);
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseURL}/api/version`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private async handleResponseError(response: Response): Promise<Error & ModelError> {
    try {
      const error = await response.json() as OllamaError;
      return this.createError(
        error.code || 'unknown',
        error.error
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
} 