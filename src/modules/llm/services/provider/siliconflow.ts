import type { ChatRequest, ChatResponse, TestResult } from '../../api/types';
import { LLMProvider } from './base';
import { LLMError, LLMErrorCode } from '../../types/error';
import type { ModelConfig } from '../../types/config';
import { SiliconFlowAdapter } from '../../adapters/siliconflow';
import { PROVIDERS } from '../../types/providers';

export class SiliconFlowProvider extends LLMProvider {
  private config: ModelConfig;
  private initialized: boolean = false;
  private adapter: SiliconFlowAdapter;

  constructor(config: ModelConfig) {
    super();
    this.config = config;
    this.adapter = new SiliconFlowAdapter();
  }

  get name(): string {
    return PROVIDERS.SILICONFLOW;
  }

  async initialize(skipModelValidation = false): Promise<void> {
    if (!this.config.auth.baseUrl) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        this.name,
        new Error('缺少服务地址')
      );
    }

    if (!this.config.auth.apiKey) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        this.name,
        new Error('缺少 API 密钥')
      );
    }

    try {
      if (!skipModelValidation) {
        const response = await this.makeRequest('/v1/models');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      this.initialized = true;
    } catch (error) {
      throw new LLMError(
        LLMErrorCode.INITIALIZATION_FAILED,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  private checkInitialized(): void {
    if (!this.initialized) {
      throw new LLMError(
        LLMErrorCode.INITIALIZATION_FAILED,
        this.name,
        new Error('Provider not initialized')
      );
    }
  }

  private async makeRequest(endpoint: string, body?: any): Promise<Response> {
    try {
      console.log('Making request to:', `${this.config.auth.baseUrl}${endpoint}`);
      console.log('Request body:', body ? JSON.stringify(body, null, 2) : 'No body');
      
      const response = await fetch(`${this.config.auth.baseUrl}${endpoint}`, {
        method: body ? 'POST' : 'GET',
        headers: {
          ...(body && { 'Content-Type': 'application/json' }),
          'Authorization': `Bearer ${this.config.auth.apiKey}`
        },
        ...(body && { body: JSON.stringify(body) })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(
          `API error: ${response.status} ${response.statusText}${
            errorData ? ` - ${JSON.stringify(errorData)}` : ''
          }`
        );
      }

      return response;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.checkInitialized();

    try {
      // 如果是付费模型，先检查余额
      if (request.model?.startsWith('Pro/')) {
        const userInfo = await this.getUserInfo();
        if (userInfo.balance <= 0) {
          throw new Error('账户余额不足，请充值后再使用付费模型');
        }
      }

      const adaptedRequest = this.adapter.adaptRequest(request);
      console.log('Adapted request:', adaptedRequest);
      
      const response = await this.makeRequest('/v1/chat/completions', adaptedRequest);
      const data = await response.json();
      return this.adapter.adaptResponse(data);
    } catch (error) {
      console.error('Chat error:', error);
      throw new LLMError(
        LLMErrorCode.API_ERROR,
        this.name,
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async *stream(request: ChatRequest): AsyncGenerator<ChatResponse> {
    this.checkInitialized();

    try {
      const adaptedRequest = this.adapter.adaptRequest({ ...request, stream: true });
      const response = await this.makeRequest('/v1/chat/completions', adaptedRequest);

      if (!response.body) {
        throw new Error('Response body is null');
      }

      yield* this.processStream(response.body);
    } catch (error) {
      throw new LLMError(
        LLMErrorCode.STREAM_ERROR,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  private async *processStream(body: ReadableStream): AsyncGenerator<ChatResponse> {
    const reader = body.getReader();
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
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6)); // 去掉 'data: ' 前缀
              if (data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content) {
                yield this.adapter.adaptResponse(data);
              }
            }
          } catch (error) {
            console.error('Error parsing stream data:', error);
            throw error;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async test(): Promise<TestResult> {
    try {
      await this.initialize();
      const response = await this.chat({
        message: 'test',
        systemPrompt: 'You are a helpful assistant.',
      });
      return {
        success: true,
        latency: 0,
      };
    } catch (error) {
      return {
        success: false,
        latency: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.makeRequest('/v1/models');
      const data = await response.json();
      
      // 过滤出可用的模型（根据余额和权限）
      const availableModels = data.data.filter((model: any) => {
        // 如果模型需要付费，检查余额
        if (model.paid_only) {
          return model.available;
        }
        return true;
      });

      return availableModels.map((model: any) => model.id);
    } catch (error) {
      console.error('Failed to list models:', error);
      throw new LLMError(
        LLMErrorCode.API_ERROR,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  async validateConfig(): Promise<void> {
    if (!this.config.auth.baseUrl) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        this.name,
        new Error('缺少服务地址')
      );
    }

    if (!this.config.auth.apiKey) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        this.name,
        new Error('缺少 API 密钥')
      );
    }

    try {
      await this.makeRequest('/v1/models');
    } catch (error) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  async getUserInfo(): Promise<{
    balance: number;
    total_used: number;
  }> {
    try {
      const response = await this.makeRequest('/v1/user/info');
      const data = await response.json();
      return {
        balance: data.balance,
        total_used: data.total_used
      };
    } catch (error) {
      throw new LLMError(
        LLMErrorCode.API_ERROR,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }
}

export default SiliconFlowProvider; 