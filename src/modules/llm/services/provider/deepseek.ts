import type { ChatRequest, ChatResponse, TestResult } from '../../api/types';
import { LLMProvider } from './base';
import { LLMError, LLMErrorCode } from '../../types/error';
import type { ModelConfig } from '../../types/config';
import { DeepseekAdapter } from '../../adapters/deepseek';

export class DeepseekProvider extends LLMProvider {
  private config: ModelConfig;
  private initialized: boolean = false;
  private adapter: DeepseekAdapter;

  constructor(config: ModelConfig) {
    super();
    this.config = config;
    this.adapter = new DeepseekAdapter();
  }

  get name(): string {
    return 'deepseek';
  }

  async initialize(): Promise<void> {
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
      const response = await fetch(`${this.config.auth.baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.auth.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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

  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.initialized) {
      throw new LLMError(
        LLMErrorCode.INITIALIZATION_FAILED,
        this.name,
        new Error('Provider not initialized')
      );
    }

    try {
      const adaptedRequest = this.adapter.adaptRequest({
        ...request,
        model: this.config.model
      });

      const response = await fetch(`${this.config.auth.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.auth.apiKey}`
        },
        body: JSON.stringify(adaptedRequest)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error?.message || 
          `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return this.adapter.adaptResponse(data);
    } catch (error) {
      throw new LLMError(
        LLMErrorCode.API_ERROR,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  async *stream(request: ChatRequest): AsyncGenerator<ChatResponse> {
    if (!this.initialized) {
      throw new LLMError(
        LLMErrorCode.INITIALIZATION_FAILED,
        this.name,
        new Error('Provider not initialized')
      );
    }

    try {
      const adaptedRequest = this.adapter.adaptRequest({
        ...request,
        model: this.config.model,
        stream: true
      });

      const response = await fetch(`${this.config.auth.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.auth.apiKey}`
        },
        body: JSON.stringify(adaptedRequest)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error?.message || 
          `HTTP error! status: ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error('Response body is null');
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

            if (line.startsWith('data: ')) {
              const chunk = line.slice(6);
              const response = DeepseekAdapter.adaptStreamChunk(chunk);
              if (response) {
                yield response;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      throw new LLMError(
        LLMErrorCode.STREAM_ERROR,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  async test(): Promise<TestResult> {
    try {
      await this.initialize();
      const startTime = Date.now();
      
      const response = await this.chat({
        message: '测试消息',
        systemPrompt: '这是一个测试。',
        temperature: 0.7,
        maxTokens: 50
      });

      return {
        success: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        latency: 0,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.auth.baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.auth.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data.map((model: any) => model.id);
    } catch (error) {
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
      const response = await fetch(`${this.config.auth.baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.auth.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }
}

export default DeepseekProvider;
