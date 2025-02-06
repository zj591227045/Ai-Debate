/**
 * SiliconFlow适配器实现
 */

import { BaseProviderAdapter } from './base';
import { LLMRequest, LLMResponse } from '../types';
import { SiliconFlowConfig } from '../types/providers';
import { LLMError, LLMErrorCode } from '../types/error';

interface SiliconFlowMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SiliconFlowApiRequest {
  model: string;
  messages: SiliconFlowMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface SiliconFlowApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface SiliconFlowStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }[];
}

export class SiliconFlowAdapter extends BaseProviderAdapter<SiliconFlowConfig> {
  public getProviderName(): string {
    return 'siliconflow';
  }

  protected async validateProviderConfig(config: SiliconFlowConfig, skipModelValidation?: boolean): Promise<void> {
    if (!config.baseUrl) {
      throw new LLMError(
        'SiliconFlow API地址未配置',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    if (!config.apiKey) {
      throw new LLMError(
        'SiliconFlow API密钥未配置',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    // 只在非跳过模型验证时检查模型
    if (!skipModelValidation && !config.model) {
      throw new LLMError(
        'SiliconFlow模型未指定',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    // 测试连接
    try {
      const response = await fetch(`${config.baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          ...(config.organizationId ? {
            'X-Organization': config.organizationId
          } : {})
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      throw new LLMError(
        'SiliconFlow API连接失败',
        LLMErrorCode.API_ERROR,
        this.getProviderName(),
        error instanceof Error ? error : undefined
      );
    }
  }

  protected async transformRequest(request: LLMRequest): Promise<SiliconFlowApiRequest> {
    if (!this.config) {
      throw new LLMError(
        '适配器未初始化',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    const messages: SiliconFlowMessage[] = [
      {
        role: 'system',
        content: request.prompt
      },
      {
        role: 'user',
        content: request.input
      }
    ];

    return {
      model: this.config.model,
      messages,
      temperature: request.parameters?.temperature,
      top_p: request.parameters?.topP,
      max_tokens: request.parameters?.maxTokens,
      stream: request.parameters?.stream
    };
  }

  protected async transformResponse(response: SiliconFlowApiResponse): Promise<LLMResponse> {
    const choice = response.choices[0];
    return {
      content: choice.message.content,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      },
      metadata: {
        id: response.id,
        model: response.model,
      }
    };
  }

  protected async transformStreamResponse(chunk: SiliconFlowStreamChunk): Promise<string> {
    const choice = chunk.choices[0];
    return choice.delta.content || '';
  }

  protected async callApi(request: SiliconFlowApiRequest): Promise<SiliconFlowApiResponse> {
    if (!this.config) {
      throw new LLMError(
        '适配器未初始化',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    console.log('SiliconFlow API Request:', {
      url: `${this.config.baseUrl}/v1/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...(this.config.organizationId ? {
          'X-Organization': this.config.organizationId
        } : {})
      },
      body: request
    });

    const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...(this.config.organizationId ? {
          'X-Organization': this.config.organizationId
        } : {})
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SiliconFlow API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new LLMError(
        `SiliconFlow API调用失败: ${response.status} ${response.statusText} - ${errorText}`,
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    }

    return await response.json();
  }

  protected async callStreamApi(request: SiliconFlowApiRequest): Promise<AsyncIterable<SiliconFlowStreamChunk>> {
    if (!this.config) {
      throw new LLMError(
        '适配器未初始化',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...(this.config.organizationId ? {
          'X-Organization': this.config.organizationId
        } : {})
      },
      body: JSON.stringify({ ...request, stream: true })
    });

    if (!response.ok) {
      throw new LLMError(
        `SiliconFlow API调用失败: ${response.statusText}`,
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    }

    if (!response.body) {
      throw new LLMError(
        'SiliconFlow API返回空响应',
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    return {
      [Symbol.asyncIterator](): AsyncIterator<SiliconFlowStreamChunk> {
        const adapter = this;
        return {
          async next(): Promise<IteratorResult<SiliconFlowStreamChunk>> {
            try {
              while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                  if (buffer.trim()) {
                    console.warn('Stream ended with non-empty buffer:', buffer);
                  }
                  return { done: true, value: undefined };
                }

                buffer += decoder.decode(value, { stream: true });

                // 处理缓冲区中的完整行
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // 保存最后一个不完整的行

                // 如果缓冲区过大，清空它
                if (buffer.length > 100 * 1024) { // 100KB
                  console.warn('Stream buffer overflow, clearing buffer');
                  buffer = '';
                }

                for (const line of lines) {
                  const trimmedLine = line.trim();
                  if (!trimmedLine || trimmedLine === 'data: [DONE]') {
                    continue;
                  }

                  if (!trimmedLine.startsWith('data: ')) {
                    console.warn('Unexpected line format:', trimmedLine);
                    continue;
                  }

                  try {
                    const json = JSON.parse(trimmedLine.slice(6));
                    return { done: false, value: json };
                  } catch (error) {
                    console.warn('Failed to parse JSON:', trimmedLine, error);
                    continue;
                  }
                }
              }
            } catch (error) {
              // 确保在发生错误时取消读取器
              reader.cancel();
              throw error;
            }
          }
        };
      }
    };
  }

  protected async fetchAvailableModels(): Promise<string[]> {
    if (!this.config) {
      throw new LLMError(
        '适配器未初始化',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    console.log('正在获取 SiliconFlow 模型列表...');
    console.log('请求配置:', {
      url: `${this.config.baseUrl}/v1/models?type=text`,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...(this.config.organizationId ? {
          'X-Organization': this.config.organizationId
        } : {})
      }
    });

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/models?type=text`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...(this.config.organizationId ? {
            'X-Organization': this.config.organizationId
          } : {})
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('获取模型列表失败:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new LLMError(
          `获取模型列表失败: ${response.status} ${response.statusText} - ${errorText}`,
          LLMErrorCode.API_ERROR,
          this.getProviderName()
        );
      }

      const data = await response.json();
      console.log('获取到的模型列表数据:', data);

      // 根据 API 文档解析返回的数据结构
      if (data.object === 'list' && Array.isArray(data.data)) {
        const models = data.data
          .filter((model: any) => model.object === 'model')
          .map((model: any) => model.id);
        console.log('解析出的可用模型:', models);
        return models;
      }

      throw new LLMError(
        '无效的模型列表响应格式',
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    } catch (error) {
      throw new LLMError(
        '获取模型列表失败',
        LLMErrorCode.API_ERROR,
        this.getProviderName(),
        error instanceof Error ? error : undefined
      );
    }
  }
} 