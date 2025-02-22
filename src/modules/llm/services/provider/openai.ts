import type { ChatRequest, ChatResponse, TestResult } from '../../api/types';
import { LLMProvider } from './base';
import { LLMError, LLMErrorCode } from '../../types/error';
import type { ModelConfig } from '../../types/config';
import { OpenAIAdapter } from '../../adapters/openai';

export class OpenAIProvider extends LLMProvider {
  private config: ModelConfig;
  private initialized: boolean = false;
  private adapter: OpenAIAdapter;
  public readonly name = 'OpenAI';

  constructor(config: ModelConfig) {
    super();
    this.config = config;
    this.adapter = new OpenAIAdapter();
  }

  async initialize(skipModelValidation?: boolean): Promise<void> {
    if (!this.config.auth?.baseUrl || !this.config.auth?.apiKey) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        this.name,
        new Error('OpenAI provider requires baseUrl and apiKey')
      );
    }

    this.initialized = true;
  }

  async validateConfig(): Promise<void> {
    if (!this.config.auth?.baseUrl || !this.config.auth?.apiKey) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        this.name,
        new Error('OpenAI provider requires baseUrl and apiKey')
      );
    }
  }

  async listModels(): Promise<string[]> {
    try {
      // 确保 baseUrl 格式正确
      const baseUrl = this.config.auth.baseUrl.replace(/\/*$/, ''); // 移除末尾的斜杠
      const apiUrl = baseUrl.includes('/v1/') ? `${baseUrl}/models` : `${baseUrl}/v1/models`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.auth.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error?.message || 
          `获取模型列表失败: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('返回数据格式错误');
      }

      return data.data.map((model: any) => model.id);
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new LLMError(
          LLMErrorCode.API_ERROR,
          this.name,
          new Error('网络请求失败，请检查网络连接和API地址是否正确')
        );
      }
      throw new LLMError(
        LLMErrorCode.API_ERROR,
        this.name,
        error instanceof Error ? error : new Error('获取模型列表失败')
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

      // 确保 baseUrl 格式正确
      const baseUrl = this.config.auth.baseUrl.replace(/\/*$/, '');
      const apiUrl = baseUrl.includes('/v1/') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;

      const response = await fetch(apiUrl, {
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
      throw this.handleError(error);
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

      // 确保 baseUrl 格式正确
      const baseUrl = this.config.auth.baseUrl.replace(/\/*$/, '');
      const apiUrl = baseUrl.includes('/v1/') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;

      const response = await fetch(apiUrl, {
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

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Stream reader not available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
          
          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedLine.slice(6));
              yield* this.adapter.adaptStream([data] as any);
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async test(): Promise<TestResult> {
    const startTime = Date.now();
    try {
      const testRequest: ChatRequest = {
        message: 'Hello, this is a test message.',
        systemPrompt: 'You are a helpful assistant.',
        model: this.config.model
      };

      await this.chat(testRequest);
      return {
        success: true,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
