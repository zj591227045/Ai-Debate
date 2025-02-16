import { LLMProvider } from './base';
import { ModelProvider } from '../../types/providers';
import { ChatRequest, ChatResponse, TestResult } from '../../api/types';
import { SiliconFlowAdapter } from '../../adapters/siliconflow';
import { LLMError, LLMErrorCode } from '../../types/error';
import { ModelConfig } from '../../types/config';
import { Message } from '../../types/common';

export class SiliconFlowProvider extends LLMProvider implements ModelProvider {
  private baseUrl: string;
  private apiKey: string;
  private config: ModelConfig;
  public readonly name = 'SiliconFlow';

  constructor(config: ModelConfig) {
    super();
    if (!config.auth?.baseUrl || !config.auth?.apiKey) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        'SiliconFlow provider requires baseUrl and apiKey'
      );
    }
    this.baseUrl = config.auth.baseUrl;
    this.apiKey = config.auth.apiKey;
    this.config = config;
  }

  getProviderName(): string {
    return this.name;
  }

  handleError(error: unknown): LLMError {
    if (error instanceof LLMError) {
      return error;
    }
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        return new LLMError(LLMErrorCode.TIMEOUT, '请求超时', error);
      }
      if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
        return new LLMError(LLMErrorCode.NETWORK_ERROR, '网络错误', error);
      }
      if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
        return new LLMError(LLMErrorCode.RATE_LIMIT_EXCEEDED, '请求频率超限', error);
      }
    }
    return new LLMError(
      LLMErrorCode.UNKNOWN,
      this.name,
      error instanceof Error ? error : undefined
    );
  }

  async initialize(skipModelValidation = false): Promise<void> {
    try {
      if (!skipModelValidation) {
        await this.validateConfig();
      }
    } catch (error) {
      throw new LLMError(
        LLMErrorCode.INITIALIZATION_FAILED,
        '初始化硅基流动服务失败',
        error as Error
      );
    }
  }

  async chat(messages: Message[], config?: Partial<ModelConfig>): Promise<Message>;
  async chat(request: ChatRequest): Promise<ChatResponse>;
  async chat(request: ChatRequest | Message[], config?: Partial<ModelConfig>): Promise<ChatResponse | Message> {
    if (Array.isArray(request)) {
      // 处理 Message[] 类型的请求
      const lastMessage = request[request.length - 1];
      const chatRequest: ChatRequest = {
        message: lastMessage.content,
        systemPrompt: request.find(msg => msg.role === 'system')?.content,
        model: config?.model || this.config.model,
        temperature: config?.parameters?.temperature || this.config.parameters.temperature,
        maxTokens: config?.parameters?.maxTokens || this.config.parameters.maxTokens,
        topP: config?.parameters?.topP || this.config.parameters.topP
      };
      const response = await this.chatInternal(chatRequest);
      return {
        role: 'assistant',
        content: response.content || ''
      };
    } else {
      // 处理 ChatRequest 类型的请求
      return this.chatInternal(request);
    }
  }

  private async chatInternal(request: ChatRequest): Promise<ChatResponse> {
    try {
      const adapter = new SiliconFlowAdapter();
      const requestData = adapter.adaptRequest(request);

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API请求失败: ${response.statusText}\n${JSON.stringify(errorData, null, 2)}`);
      }

      const data = await response.json();
      return adapter.adaptResponse(data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async *stream(request: ChatRequest): AsyncGenerator<ChatResponse> {
    try {
      const adapter = new SiliconFlowAdapter();
      const requestData = adapter.adaptRequest({
        ...request,
        stream: true
      });

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API请求失败: ${response.statusText}\n${JSON.stringify(errorData, null, 2)}`);
      }

      if (!response.body) {
        throw new Error('响应体为空');
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
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

            if (trimmedLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmedLine.slice(6));
                const response = adapter.adaptResponse(data);
                if (response.content === null) {
                  response.content = '';
                }
                yield response;
              } catch (error) {
                console.error('解析流式响应失败:', error);
              }
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

  async *streamChat(messages: Message[], config?: Partial<ModelConfig>): AsyncGenerator<Message> {
    const chatRequest: ChatRequest = {
      message: messages[messages.length - 1].content,
      systemPrompt: messages.find(msg => msg.role === 'system')?.content,
      model: config?.model || this.config.model,
      temperature: config?.parameters?.temperature || this.config.parameters.temperature,
      maxTokens: config?.parameters?.maxTokens || this.config.parameters.maxTokens,
      topP: config?.parameters?.topP || this.config.parameters.topP,
      stream: true
    };

    for await (const response of this.stream(chatRequest)) {
      yield {
        role: 'assistant',
        content: response.content || ''
      };
    }
  }

  async test(): Promise<TestResult> {
    const startTime = Date.now();
    try {
      await this.chat({
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
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : '测试失败'
      };
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`获取模型列表失败: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.map((model: any) => model.id);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async validateConfig(): Promise<void> {
    try {
      if (!this.config.auth?.baseUrl) {
        throw new Error('缺少服务地址');
      }
      if (!this.config.auth?.apiKey) {
        throw new Error('缺少API密钥');
      }
      if (!this.config.model) {
        throw new Error('缺少模型配置');
      }

      // 验证连接
      await this.listModels();
    } catch (error) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        '硅基流动配置验证失败',
        error as Error
      );
    }
  }

  async getCapabilities(): Promise<{
    streaming: boolean;
    functionCalling: boolean;
    maxContextTokens: number;
    maxResponseTokens: number;
    multipleCompletions: boolean;
  }> {
    return {
      streaming: true,
      functionCalling: false,
      maxContextTokens: 4096,
      maxResponseTokens: 2048,
      multipleCompletions: false
    };
  }
}