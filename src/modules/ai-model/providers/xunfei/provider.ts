/**
 * 讯飞星火供应商实现
 */

import { ModelProvider } from '../../types/providers';
import { Message, ModelParameters, ModelResponse, ModelError, ModelCapabilities } from '../../types/common';
import { ApiConfig } from '../../types/config';
import { ModelErrorHandler } from '../../utils/error-handler';
import { ModelRateLimiter } from '../../utils/rate-limiter';
import { ModelTokenCounter } from '../../utils/token-counter';
import {
  XunfeiConfig,
  XunfeiResponse,
  XunfeiStreamResponse,
  XunfeiError,
  XunfeiRequestParams,
  XunfeiAuthParams,
} from './types';

export class XunfeiProvider implements ModelProvider {
  private config!: XunfeiConfig;
  private errorHandler: ModelErrorHandler;
  private rateLimiter: ModelRateLimiter;
  private tokenCounter: ModelTokenCounter;
  private baseURL: string;
  private wsBaseURL: string;

  constructor() {
    this.errorHandler = new ModelErrorHandler();
    this.rateLimiter = new ModelRateLimiter();
    this.tokenCounter = new ModelTokenCounter(8192); // 讯飞星火的上下文窗口
    this.baseURL = 'https://api.xf-yun.com/v1';
    this.wsBaseURL = 'wss://api.xf-yun.com/v1/chat';
  }

  async initialize(config: ApiConfig): Promise<void> {
    if (!config.providerSpecific?.xunfei) {
      throw new Error('缺少讯飞星火所需的配置参数');
    }

    const xunfeiConfig = config.providerSpecific.xunfei;
    
    this.config = {
      apiKey: config.apiKey,
      appId: xunfeiConfig.appId,
      apiSecret: xunfeiConfig.apiSecret,
      baseURL: config.endpoint || this.baseURL,
      defaultModel: 'spark-v2',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    };
  }

  getCapabilities(): ModelCapabilities {
    return {
      streaming: true,
      functionCalling: false,
      maxContextTokens: 8192,
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
      const response = await this.makeWebSocketRequest(params);
      
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

      const params = this.prepareRequestParams(messages, parameters);
      const ws = await this.createWebSocket();

      try {
        ws.send(JSON.stringify(params));

        for await (const message of this.createWebSocketStream(ws)) {
          const response = JSON.parse(message) as XunfeiStreamResponse;
          
          if (response.header.code !== 0) {
            throw this.createError('server', response.header.message);
          }
          
          if (!response.payload.choices[0]?.text[0]?.content) continue;
          
          yield this.convertStreamResponse(response);
          
          if (response.payload.choices[0].status === 2) {
            break;
          }
        }
      } finally {
        ws.close();
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
      const params = this.prepareRequestParams([{ role: 'user', content: '测试连接' }]);
      const ws = await this.createWebSocket();
      ws.close();
      return true;
    } catch {
      return false;
    }
  }

  private async createWebSocket(): Promise<WebSocket> {
    const url = await this.generateAuthUrl();
    const ws = new WebSocket(url);
    return new Promise((resolve, reject) => {
      ws.onopen = () => resolve(ws);
      ws.onerror = () => reject(new Error('WebSocket连接失败'));
    });
  }

  private async *createWebSocketStream(ws: WebSocket): AsyncGenerator<string> {
    let resolver: ((value: string) => void) | null = null;
    const messageQueue: string[] = [];

    ws.onmessage = (event) => {
      if (resolver) {
        resolver(event.data);
        resolver = null;
      } else {
        messageQueue.push(event.data);
      }
    };

    while (true) {
      if (messageQueue.length > 0) {
        yield messageQueue.shift()!;
      } else {
        yield new Promise<string>((resolve) => {
          resolver = resolve;
        });
      }
    }
  }

  private async generateAuthUrl(): Promise<string> {
    const host = new URL(this.wsBaseURL).host;
    const path = new URL(this.wsBaseURL).pathname;
    const date = new Date().toUTCString();
    const signature = await this.generateSignature({
      host,
      path,
      apiKey: this.config.apiKey,
      apiSecret: this.config.apiSecret,
    });

    const url = new URL(this.wsBaseURL);
    url.searchParams.append('authorization', signature);
    url.searchParams.append('date', date);
    url.searchParams.append('host', host);
    
    return url.toString();
  }

  private async generateSignature(params: XunfeiAuthParams): Promise<string> {
    const { host, path, apiKey, apiSecret } = params;
    const date = new Date().toUTCString();
    const signString = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(signString);
    const key = encoder.encode(apiSecret);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      data
    );
    
    const signatureArray = Array.from(new Uint8Array(signature));
    const base64Signature = btoa(String.fromCharCode.apply(null, signatureArray));
    return `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${base64Signature}"`;
  }

  private async makeWebSocketRequest(params: XunfeiRequestParams): Promise<XunfeiResponse> {
    return new Promise(async (resolve, reject) => {
      let result: XunfeiResponse = {
        header: { code: 0, message: '', sid: '', status: 0 },
        payload: {
          choices: [{
            status: 0,
            seq: 0,
            text: []
          }],
          usage: {
            text: {
              question_tokens: 0,
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0
            }
          }
        }
      };

      try {
        const ws = await this.createWebSocket();
        
        ws.send(JSON.stringify(params));

        ws.onmessage = (event: MessageEvent) => {
          const response = JSON.parse(event.data) as XunfeiStreamResponse;
          
          if (response.header.code !== 0) {
            ws.close();
            reject(this.createError('server', response.header.message));
            return;
          }

          const choice = response.payload.choices[0];
          if (!choice) return;

          result.header = response.header;
          result.payload.choices[0].text.push(...choice.text);
          result.payload.choices[0].status = choice.status;
          result.payload.choices[0].seq = choice.seq;

          if (choice.status === 2) {
            ws.close();
            resolve(result);
          }
        };

        ws.onerror = (event: Event) => {
          reject(this.createError('server', '连接错误'));
        };

        ws.onclose = () => {
          if (result.payload.choices[0].status !== 2) {
            reject(this.createError('server', '连接关闭'));
          }
        };
      } catch (error) {
        reject(this.createError('server', '创建WebSocket连接失败'));
      }
    });
  }

  private prepareRequestParams(
    messages: Message[],
    parameters?: ModelParameters
  ): XunfeiRequestParams {
    return {
      header: {
        app_id: this.config.appId,
      },
      parameter: {
        chat: {
          domain: this.config.defaultModel,
          temperature: parameters?.temperature,
          top_k: parameters?.topP ? Math.floor(parameters.topP * 100) : undefined,
          max_tokens: parameters?.maxTokens,
        },
      },
      payload: {
        message: {
          text: messages.map(msg => ({
            role: this.mapRole(msg.role),
            content: msg.content,
          })),
        },
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

  private convertResponse(response: XunfeiResponse): ModelResponse {
    const content = response.payload.choices[0].text
      .map(t => t.content)
      .join('');

    return {
      content,
      usage: {
        promptTokens: response.payload.usage?.text.prompt_tokens || 0,
        completionTokens: response.payload.usage?.text.completion_tokens || 0,
        totalTokens: response.payload.usage?.text.total_tokens || 0,
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: 'stop',
      },
    };
  }

  private convertStreamResponse(response: XunfeiStreamResponse): ModelResponse {
    const content = response.payload.choices[0].text
      .map(t => t.content)
      .join('');

    return {
      content,
      usage: {
        promptTokens: 0,
        completionTokens: this.countTokens(content),
        totalTokens: this.countTokens(content),
      },
      metadata: {
        model: this.config.defaultModel,
        finishReason: response.payload.choices[0].status === 2 ? 'stop' : 'length',
      },
    };
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
      case '10001':
      case '10002':
      case '10003':
        return 'auth';
      case '10004':
      case '10005':
        return 'rate_limit';
      case '10006':
      case '10007':
      case '10008':
        return 'invalid_request';
      case '10009':
      case '10010':
        return 'server';
      case '10011':
        return 'timeout';
      default:
        return 'unknown';
    }
  }

  async listModels(): Promise<string[]> {
    // 讯飞目前提供固定的模型列表
    return [
      'spark-v2.0',
      'spark-v3.0',
      'spark-v3.5'
    ];
  }
} 
