/**
 * 文心一言供应商实现
 */

import { ModelProvider } from '../../types/providers';
import { Message, ModelParameters, ModelResponse, ModelError, ModelCapabilities } from '../../types/common';
import { ApiConfig } from '../../types/config';
import { ModelErrorHandler } from '../../utils/error-handler';
import { ModelRateLimiter } from '../../utils/rate-limiter';
import { ModelTokenCounter } from '../../utils/token-counter';
import {
  BaiduConfig,
  BaiduResponse,
  BaiduStreamResponse,
  BaiduError,
  BaiduRequestParams,
  BaiduAuthResponse,
} from './types';

export class BaiduProvider implements ModelProvider {
  private config!: BaiduConfig;
  private errorHandler: ModelErrorHandler;
  private rateLimiter: ModelRateLimiter;
  private tokenCounter: ModelTokenCounter;
  private baseURL: string;
  private authURL: string;

  constructor() {
    this.errorHandler = new ModelErrorHandler();
    this.rateLimiter = new ModelRateLimiter();
    this.tokenCounter = new ModelTokenCounter(16000); // 文心一言的上下文窗口
    this.baseURL = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat';
    this.authURL = 'https://aip.baidubce.com/oauth/2.0/token';
  }

  async initialize(config: ApiConfig): Promise<void> {
    if (!config.providerSpecific?.baidu) {
      throw new Error('缺少文心一言所需的配置参数');
    }

    const baiduConfig = config.providerSpecific.baidu;
    
    this.config = {
      apiKey: config.apiKey,
      secretKey: baiduConfig.secretKey,
      baseURL: config.endpoint || this.baseURL,
      defaultModel: 'ernie-bot-4',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    };

    // 初始化时获取 access token
    await this.refreshAccessToken();
  }

  getCapabilities(): ModelCapabilities {
    return {
      streaming: true,
      functionCalling: true,
      maxContextTokens: 16000,
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

      await this.ensureValidAccessToken();
      const params = this.prepareRequestParams(messages, parameters);
      const response = await this.makeRequest<BaiduResponse>('', params);
      
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

      await this.ensureValidAccessToken();
      const params = this.prepareRequestParams(messages, parameters, true);
      const response = await fetch(`${this.config.baseURL}?access_token=${this.config.accessToken}`, {
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
              const streamResponse = JSON.parse(line) as BaiduStreamResponse;
              yield this.convertStreamResponse(streamResponse);
              
              if (streamResponse.is_end) {
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
      await this.refreshAccessToken();
      return true;
    } catch {
      return false;
    }
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  private async ensureValidAccessToken(): Promise<void> {
    const now = Date.now();
    if (!this.config.accessToken || !this.config.accessTokenExpireTime || now >= this.config.accessTokenExpireTime) {
      await this.refreshAccessToken();
    }
  }

  private async refreshAccessToken(): Promise<void> {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.apiKey,
      client_secret: this.config.secretKey,
    });

    const response = await fetch(`${this.authURL}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw this.createError('auth', '获取访问令牌失败');
    }

    const authResponse = await response.json() as BaiduAuthResponse;
    this.config.accessToken = authResponse.access_token;
    this.config.accessTokenExpireTime = Date.now() + (authResponse.expires_in * 1000) - 60000; // 提前1分钟过期
  }

  private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.config.baseURL}${endpoint}?access_token=${this.config.accessToken}`, {
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
  ): BaiduRequestParams {
    return {
      messages: messages.map(msg => ({
        role: this.mapRole(msg.role),
        content: msg.content,
      })),
      stream,
      temperature: parameters?.temperature,
      top_p: parameters?.topP,
      penalty_score: parameters?.presencePenalty,
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

  private convertResponse(response: BaiduResponse): ModelResponse {
    return {
      content: response.result,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: response.is_end ? 'stop' : 'length',
      },
    };
  }

  private convertStreamResponse(response: BaiduStreamResponse): ModelResponse {
    return {
      content: response.result,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || this.countTokens(response.result),
        totalTokens: response.usage?.total_tokens || this.countTokens(response.result),
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: response.is_end ? 'stop' : 'length',
      },
    };
  }

  private async handleResponseError(response: Response): Promise<Error & ModelError> {
    try {
      const error = await response.json() as BaiduError;
      return this.createError(
        this.mapErrorType(error.error_code),
        error.error_msg
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
      case 1:
      case 2:
      case 'invalid_client':
      case 'invalid_grant':
        return 'auth';
      case 4:
      case 18:
      case 'too_many_requests':
        return 'rate_limit';
      case 3:
      case 6:
      case 'invalid_request':
        return 'invalid_request';
      case 7:
      case 8:
      case 'server_error':
        return 'server';
      case 100:
      case 'timeout':
        return 'timeout';
      default:
        return 'unknown';
    }
  }

  async listModels(): Promise<string[]> {
    // 百度目前提供固定的模型列表
    return [
      'ERNIE-Bot-4',
      'ERNIE-Bot-8K',
      'ERNIE-Bot',
      'ERNIE-Bot-turbo',
      'BLOOMZ-7B',
      'Llama-2-7b-chat',
      'Llama-2-13b-chat',
      'Llama-2-70b-chat'
    ];
  }
} 