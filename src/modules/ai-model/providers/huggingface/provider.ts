/**
 * Hugging Face供应商实现
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
  HuggingFaceConfig,
  HuggingFaceResponse,
  HuggingFaceStreamResponse,
  HuggingFaceError,
  HuggingFaceRequestParams,
} from './types';

export class HuggingFaceProvider implements ModelProvider {
  private config!: HuggingFaceConfig;
  private errorHandler: ModelErrorHandler;
  private rateLimiter: ModelRateLimiter;
  private tokenCounter: ModelTokenCounter;
  private inferenceUrl!: string;
  private initialized: boolean = false;

  constructor() {
    this.errorHandler = new ModelErrorHandler();
    this.rateLimiter = new ModelRateLimiter();
    this.tokenCounter = new ModelTokenCounter(8192); // Hugging Face的上下文窗口
  }

  async initialize(config: ApiConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('API key is required for Hugging Face');
    }

    if (!config.providerSpecific?.huggingface?.modelRevision) {
      throw new Error('Model revision is required for Hugging Face');
    }

    const modelRevision = config.providerSpecific.huggingface.modelRevision;
    if (!modelRevision) {
      throw new Error('Model revision cannot be empty');
    }

    this.config = {
      apiKey: config.apiKey,
      baseURL: config.endpoint || 'https://api-inference.huggingface.co/models',
      defaultModel: modelRevision,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      waitForModel: config.providerSpecific.huggingface.waitForModel || false,
      useCache: config.providerSpecific.huggingface.useCache || true,
    };

    this.inferenceUrl = `${this.config.baseURL}/${this.config.defaultModel}`;
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
      const response = await fetch(this.inferenceUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestParams),
      });

      if (!response.ok) {
        const error = await response.json() as HuggingFaceError;
        throw this.createError(
          error.error_type || 'unknown',
          error.error
        );
      }

      const result = await response.json() as HuggingFaceResponse;
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
      const requestParams = this.prepareRequestParameters(messages, parameters);
      const response = await fetch(this.inferenceUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestParams),
      });

      if (!response.ok) {
        const error = await response.json() as HuggingFaceError;
        throw this.createError(
          error.error_type || 'unknown',
          error.error
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const streamResponse = JSON.parse(chunk) as HuggingFaceStreamResponse;

        const modelResponse = this.convertStreamResponse(streamResponse);
        this.rateLimiter.recordRequest(1); // 每个token记录一次
        yield modelResponse;
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private prepareRequestParameters(
    messages: Message[],
    parameters?: ModelParameters
  ): HuggingFaceRequestParams {
    const lastMessage = messages[messages.length - 1];
    return {
      inputs: lastMessage.content,
      parameters: {
        max_new_tokens: parameters?.maxTokens,
        temperature: parameters?.temperature,
        top_p: parameters?.topP,
        repetition_penalty: parameters?.frequencyPenalty,
        do_sample: true,
        return_full_text: false,
      },
      options: {
        wait_for_model: this.config.waitForModel,
        use_cache: this.config.useCache,
      },
    };
  }

  private convertResponse(response: HuggingFaceResponse): ModelResponse {
    return {
      content: response.generated_text,
      usage: {
        promptTokens: 0,
        completionTokens: response.details?.generated_tokens || 0,
        totalTokens: response.details?.generated_tokens || 0,
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: response.details?.finish_reason || 'stop',
      },
    };
  }

  private convertStreamResponse(response: HuggingFaceStreamResponse): ModelResponse {
    return {
      content: response.token.text,
      usage: {
        promptTokens: 0,
        completionTokens: 1,
        totalTokens: 1,
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: response.details?.finish_reason || 'length',
      },
    };
  }

  countTokens(text: string): number {
    return this.tokenCounter.countTextTokens(text);
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private createError(type: string, message: string): Error & ModelError {
    const error = new Error(message) as Error & ModelError;
    error.name = 'ModelError';
    error.code = type;
    error.type = this.mapErrorType(type);
    error.retryable = type === 'rate_limit' || type === 'server';
    return error;
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
      const response = await fetch('https://huggingface.co/api/models?filter=text-generation', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw await this.handleResponseError(response);
      }

      const data = await response.json();
      return data.map((model: { id: string }) => model.id);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async handleResponseError(response: Response): Promise<Error & ModelError> {
    try {
      const error = await response.json() as HuggingFaceError;
      return this.createError(
        error.error_type || 'unknown',
        error.error
      );
    } catch {
      return this.createError(
        'unknown',
        `HTTP错误 ${response.status}: ${response.statusText}`
      );
    }
  }
} 