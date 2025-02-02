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
  OllamaProviderSpecific,
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
    const ollamaConfig = config.providerSpecific?.ollama as OllamaProviderSpecific;
    if (!ollamaConfig?.model) {
      throw new Error('缺少Ollama配置或模型名称');
    }

    const baseURL = ollamaConfig.baseUrl || config.endpoint || 'http://localhost:11434';
    
    // 先验证服务器连接
    try {
      const response = await fetch(`${baseURL}/api/tags`);
      if (!response.ok) {
        throw new Error(`HTTP错误 ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (!Array.isArray(data.models)) {
        throw new Error('获取模型列表失败：返回格式错误');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error(`无法连接到Ollama服务器(${baseURL}): 连接被拒绝`);
      }
      throw new Error(`无法连接到Ollama服务器(${baseURL}): ${(error as Error).message}`);
    }

    // 服务器连接验证成功后，设置配置
    this.config = {
      baseURL,
      defaultModel: ollamaConfig.model,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      options: ollamaConfig.options,
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
      const response = await fetch(`${this.config.baseURL}/api/chat`, {
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
      const response = await fetch(`${this.config.baseURL}/api/chat`, {
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

      let buffer = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          try {
            const streamResponse = JSON.parse(line) as OllamaStreamResponse;
            const modelResponse = this.convertStreamResponse(streamResponse);
            this.rateLimiter.recordRequest(1);
            yield modelResponse;

            if (streamResponse.done) return;
          } catch (e) {
            console.warn('Failed to parse stream response:', e);
          }
        }
      }

      if (buffer) {
        try {
          const streamResponse = JSON.parse(buffer) as OllamaStreamResponse;
          const modelResponse = this.convertStreamResponse(streamResponse);
          this.rateLimiter.recordRequest(1);
          yield modelResponse;
        } catch (e) {
          console.warn('Failed to parse final buffer:', e);
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
  ): OllamaRequestParams {
    return {
      model: this.config.defaultModel,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      stream,
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
      content: response.message?.content || response.response || '',
      usage: {
        promptTokens: response.prompt_eval_count || 0,
        completionTokens: response.eval_count || 0,
        totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
      },
      metadata: {
        model: response.model || this.config.defaultModel,
        finishReason: response.done ? 'stop' : 'length',
      },
    };
  }

  private convertStreamResponse(response: OllamaStreamResponse): ModelResponse {
    return {
      content: response.message?.content || response.response || '',
      usage: {
        promptTokens: response.prompt_eval_count || 0,
        completionTokens: response.eval_count || 0,
        totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
      },
      metadata: {
        model: response.model || this.config.defaultModel,
        finishReason: response.done ? 'stop' : 'length',
      },
    };
  }

  countTokens(text: string): number {
    return this.tokenCounter.countTextTokens(text);
  }

  async listModels(): Promise<string[]> {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    try {
      const response = await fetch(`${this.config.baseURL}/api/tags`);
      if (!response.ok) {
        throw await this.handleResponseError(response);
      }
      const data = await response.json();
      if (!Array.isArray(data.models)) {
        throw this.createError('server', '获取模型列表失败：返回格式错误');
      }
      return data.models.map((model: { name: string }) => model.name);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw this.createError('server', `无法连接到Ollama服务器：${this.config.baseURL}`);
      }
      throw this.handleError(error);
    }
  }

  async validateApiKey(): Promise<boolean> {
    // Ollama 不需要 API 密钥验证
    return true;
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

  private async handleResponseError(response: Response): Promise<Error & ModelError> {
    try {
      const error = await response.json() as OllamaError;
      let errorType = 'unknown';
      
      // 根据HTTP状态码和错误类型确定错误类型
      if (response.status === 404) {
        errorType = 'not_found';
      } else if (response.status === 401 || response.status === 403) {
        errorType = 'auth';
      } else if (response.status === 429) {
        errorType = 'rate_limit';
      } else if (response.status >= 500) {
        errorType = 'server';
      } else if (error.type) {
        errorType = error.type;
      }

      return this.createError(
        errorType,
        error.error || `HTTP错误 ${response.status}: ${response.statusText}`
      );
    } catch {
      // 如果无法解析JSON响应，则根据HTTP状态码创建错误
      let errorType = 'unknown';
      if (response.status === 404) {
        errorType = 'not_found';
      } else if (response.status === 401 || response.status === 403) {
        errorType = 'auth';
      } else if (response.status === 429) {
        errorType = 'rate_limit';
      } else if (response.status >= 500) {
        errorType = 'server';
      }

      return this.createError(
        errorType,
        `HTTP错误 ${response.status}: ${response.statusText}`
      );
    }
  }
} 