import type { ChatRequest, ChatResponse, TestResult } from '../../api/types';
import { LLMProvider } from './base';
import { LLMError, LLMErrorCode } from '../../types/error';
import type { ModelConfig } from '../../types/config';
import { SiliconFlowAdapter } from '../../adapters/siliconflow';

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
    return 'siliconflow';
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
      const response = await this.makeRequest('/v1/models');
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
    const response = await fetch(`${this.config.auth.baseUrl}${endpoint}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        ...(body && { 'Content-Type': 'application/json' }),
        'Authorization': `Bearer ${this.config.auth.apiKey}`
      },
      ...(body && { body: JSON.stringify(body) })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.checkInitialized();

    try {
      const adaptedRequest = this.adapter.adaptRequest(request);
      const response = await this.makeRequest('/v1/completions', adaptedRequest);
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
    this.checkInitialized();

    try {
      const adaptedRequest = this.adapter.adaptRequest({ ...request, stream: true });
      const response = await this.makeRequest('/v1/completions', adaptedRequest);

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
            const data = JSON.parse(line.replace(/^data: /, ''));
            yield this.adapter.adaptResponse(data);
          } catch (error) {
            console.error('Error parsing stream data:', error);
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
      await this.makeRequest('/v1/models');
    } catch (error) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }
}

export default SiliconFlowProvider; 