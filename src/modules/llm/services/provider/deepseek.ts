import type { ChatRequest, ChatResponse, TestResult } from '../../api/types';
import { LLMProvider } from './base';
import { LLMError, LLMErrorCode } from '../../types/error';
import type { ModelConfig } from '../../types/config';

export class DeepseekProvider extends LLMProvider {
  private config: ModelConfig;
  private initialized: boolean = false;

  constructor(config: ModelConfig) {
    super();
    this.config = config;
  }

  get name(): string {
    return 'deepseek';
  }

  async initialize(): Promise<void> {
    if (!this.config.auth.baseUrl) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        this.name
      );
    }

    if (!this.config.auth.apiKey) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        this.name
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
        this.name
      );
    }

    try {
      const response = await fetch(`${this.config.auth.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.auth.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: request.message }],
          stream: false,
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          top_p: request.topP
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        metadata: {
          modelId: this.config.model,
          provider: this.name,
          timestamp: Date.now(),
          tokensUsed: data.usage
        }
      };
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
        this.name
      );
    }

    try {
      const response = await fetch(`${this.config.auth.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.auth.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: request.message }],
          stream: true,
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          top_p: request.topP
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
            if (data.choices?.[0]?.delta?.content) {
              yield {
                content: data.choices[0].delta.content,
                metadata: {
                  modelId: this.config.model,
                  provider: this.name,
                  timestamp: Date.now()
                }
              };
            }
          } catch (error) {
            console.error('Error parsing stream data:', error);
          }
        }
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
