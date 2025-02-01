/**
 * Gemini供应商实现
 */

import { ModelProvider } from '../../types/providers';
import { Message, ModelParameters, ModelResponse, ModelError, ModelCapabilities } from '../../types/common';
import { ApiConfig } from '../../types/config';
import { ModelErrorHandler } from '../../utils/error-handler';
import { ModelRateLimiter } from '../../utils/rate-limiter';
import { ModelTokenCounter } from '../../utils/token-counter';
import {
  GeminiConfig,
  GeminiResponse,
  GeminiStreamResponse,
  GeminiError,
  GeminiRequestParams,
} from './types';

export class GeminiProvider implements ModelProvider {
  private config!: GeminiConfig;
  private errorHandler: ModelErrorHandler;
  private rateLimiter: ModelRateLimiter;
  private tokenCounter: ModelTokenCounter;
  private baseURL: string;

  constructor() {
    this.errorHandler = new ModelErrorHandler();
    this.rateLimiter = new ModelRateLimiter();
    this.tokenCounter = new ModelTokenCounter(32000); // Gemini-Pro 的上下文窗口
    this.baseURL = 'https://generativelanguage.googleapis.com/v1';
  }

  async initialize(config: ApiConfig): Promise<void> {
    if (!config.providerSpecific?.gemini) {
      throw new Error('缺少 Gemini 所需的配置参数');
    }

    const geminiConfig = config.providerSpecific.gemini;
    
    this.config = {
      apiKey: config.apiKey,
      baseURL: config.endpoint || this.baseURL,
      defaultModel: 'gemini-pro',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      safetySettings: geminiConfig.safetySettings,
    };
  }

  getCapabilities(): ModelCapabilities {
    return {
      streaming: true,
      functionCalling: true,
      maxContextTokens: 32000,
      maxResponseTokens: 8192,
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
      const response = await this.makeRequest<GeminiResponse>('/models/gemini-pro:generateContent', params);
      
      const modelResponse = this.convertResponse(response);
      this.rateLimiter.recordRequest(this.countTokens(modelResponse.content));
      
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

      const params = this.prepareRequestParams(messages, parameters);
      const response = await fetch(`${this.config.baseURL}/models/gemini-pro:streamGenerateContent?key=${this.config.apiKey}`, {
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

            try {
              const streamResponse = JSON.parse(line) as GeminiStreamResponse;
              if (!streamResponse.candidates?.[0]?.content?.parts?.[0]?.text) continue;
              
              yield this.convertStreamResponse(streamResponse);
              
              if (streamResponse.candidates[0].finishReason) {
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
      const response = await fetch(`${this.config.baseURL}/models?key=${this.config.apiKey}`, {
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
    };
  }

  private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.config.baseURL}${endpoint}?key=${this.config.apiKey}`, {
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
  ): GeminiRequestParams {
    // 将消息转换为 Gemini 格式
    const contents = messages.map(msg => ({
      parts: [{ text: msg.content }],
      role: this.mapRole(msg.role),
    }));

    return {
      contents,
      safetySettings: this.config.safetySettings,
      generationConfig: {
        temperature: parameters?.temperature,
        topP: parameters?.topP,
        topK: 40,
        maxOutputTokens: parameters?.maxTokens,
        stopSequences: parameters?.stop,
      },
    };
  }

  private mapRole(role: string): string {
    switch (role) {
      case 'system':
        return 'user'; // Gemini 不支持 system 角色，将其转换为 user
      case 'assistant':
        return 'model';
      case 'user':
      default:
        return 'user';
    }
  }

  private convertResponse(response: GeminiResponse): ModelResponse {
    const candidate = response.candidates[0];
    if (!candidate) {
      throw this.createError('server', '响应中没有候选项');
    }

    const content = candidate.content.parts.map(part => part.text).join('');
    
    return {
      content,
      usage: {
        promptTokens: this.countTokens(response.candidates[0].content.parts[0].text),
        completionTokens: this.countTokens(content),
        totalTokens: this.countTokens(response.candidates[0].content.parts[0].text) + this.countTokens(content),
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: candidate.finishReason,
      },
    };
  }

  private convertStreamResponse(response: GeminiStreamResponse): ModelResponse {
    const candidate = response.candidates[0];
    if (!candidate) {
      throw this.createError('server', '响应中没有候选项');
    }

    const content = candidate.content.parts.map(part => part.text).join('');
    
    return {
      content,
      usage: {
        promptTokens: 0,
        completionTokens: this.countTokens(content),
        totalTokens: this.countTokens(content),
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: candidate.finishReason || 'length',
      },
    };
  }

  private async handleResponseError(response: Response): Promise<Error & ModelError> {
    try {
      const error = await response.json() as GeminiError;
      return this.createError(
        this.mapErrorType(error.error.code),
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

  private mapErrorType(type: string | number): ModelError['type'] {
    switch (type) {
      case 401:
      case 403:
        return 'auth';
      case 429:
        return 'rate_limit';
      case 400:
      case 404:
        return 'invalid_request';
      case 500:
      case 502:
      case 503:
        return 'server';
      case 504:
        return 'timeout';
      default:
        return 'unknown';
    }
  }
} 