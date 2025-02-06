/**
 * Deepseek适配器实现
 */

import { BaseProviderAdapter } from './base';
import { LLMRequest, LLMResponse } from '../types';
import { DeepseekConfig } from '../types/providers';
import { LLMError, LLMErrorCode } from '../types/error';

interface DeepseekMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface DeepseekApiRequest {
  model: string;
  messages: DeepseekMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
}

interface DeepseekApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: DeepseekMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DeepseekStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: string | null;
  }[];
}

interface DeepseekStreamIterator extends AsyncIterator<DeepseekStreamChunk> {
  adapter: DeepseekAdapter;
}

export class DeepseekAdapter extends BaseProviderAdapter<DeepseekConfig> {
  public getProviderName(): string {
    return 'deepseek';
  }

  protected async validateProviderConfig(config: DeepseekConfig, skipModelValidation?: boolean): Promise<void> {
    if (!config.baseUrl) {
      throw new LLMError(
        'Deepseek API地址未配置',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    if (!config.apiKey) {
      throw new LLMError(
        'Deepseek API密钥未配置',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    // 只在非跳过模型验证时检查模型
    if (!skipModelValidation && !config.model) {
      throw new LLMError(
        'Deepseek模型未指定',
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
            'Deepseek-Organization': config.organizationId
          } : {})
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      throw new LLMError(
        'Deepseek API连接失败',
        LLMErrorCode.API_ERROR,
        this.getProviderName(),
        error as Error
      );
    }
  }

  protected async transformRequest(request: LLMRequest): Promise<DeepseekApiRequest> {
    if (!this.config) {
      throw new LLMError(
        '适配器未初始化',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    // 构建基础消息
    const messages: DeepseekMessage[] = [];
    
    // 如果有系统提示，添加为第一条消息
    if (request.prompt) {
      messages.push({
        role: 'system',
        content: request.prompt
      });
    }

    // 添加用户输入
    messages.push({
      role: 'user',
      content: request.input
    });

    // 对于 reasoner 模型，不再添加固定的思考提示
    // 让模型自然地进行推理过程

    return {
      model: this.config.model,
      messages,
      stream: request.parameters?.stream,
      temperature: request.parameters?.temperature,
      max_tokens: request.parameters?.maxTokens,
      top_p: request.parameters?.topP,
      frequency_penalty: request.parameters?.frequencyPenalty,
      presence_penalty: request.parameters?.presencePenalty,
      stop: request.parameters?.stop
    };
  }

  protected async transformResponse(response: DeepseekApiResponse): Promise<LLMResponse> {
    const choice = response.choices[0];
    if (!choice) {
      throw new LLMError(
        'Deepseek API返回空响应',
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    }

    return {
      content: choice.message.content,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      },
      metadata: {
        model: response.model,
        finishReason: choice.finish_reason
      }
    };
  }

  protected async transformStreamResponse(chunk: DeepseekStreamChunk): Promise<string> {
    const choice = chunk.choices[0];
    return choice.delta.content || '';
  }

  protected async callApi(request: DeepseekApiRequest): Promise<DeepseekApiResponse> {
    if (!this.config) {
      throw new LLMError(
        '适配器未初始化',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    console.log('Deepseek API Request:', {
      url: `${this.config.baseUrl}/v1/chat/completions`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...(this.config.organizationId ? {
          'Deepseek-Organization': this.config.organizationId
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
          'Deepseek-Organization': this.config.organizationId
        } : {})
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepseek API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new LLMError(
        `Deepseek API调用失败: ${response.status} ${response.statusText} - ${errorText}`,
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    }

    return await response.json();
  }

  protected async callStreamApi(request: DeepseekApiRequest): Promise<AsyncIterable<DeepseekStreamChunk>> {
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
          'Deepseek-Organization': this.config.organizationId
        } : {})
      },
      body: JSON.stringify({ ...request, stream: true })
    });

    if (!response.ok) {
      throw new LLMError(
        `Deepseek API调用失败: ${response.statusText}`,
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    }

    if (!response.body) {
      throw new LLMError(
        'Deepseek API返回空响应',
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const adapter = this;

    return {
      [Symbol.asyncIterator](): DeepseekStreamIterator {
        return {
          adapter,
          async next() {
            try {
              while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                  // 处理缓冲区中剩余的数据
                  if (buffer.trim()) {
                    try {
                      const data = buffer.replace('data: ', '').trim();
                      if (data === '[DONE]') {
                        return { done: true, value: undefined };
                      }
                      const chunk = JSON.parse(data) as DeepseekStreamChunk;
                      buffer = '';
                      return { done: false, value: chunk };
                    } catch {
                      // 忽略最后的无效数据
                    }
                  }
                  return { done: true, value: undefined };
                }

                // 将新的数据添加到缓冲区
                buffer += decoder.decode(value, { stream: true });

                // 尝试从缓冲区中提取完整的JSON对象
                let startIndex = 0;
                while (true) {
                  // 查找下一个JSON对象的边界
                  const endIndex = buffer.indexOf('\n', startIndex);
                  if (endIndex === -1) break;

                  const chunk = buffer.slice(startIndex, endIndex).trim();
                  startIndex = endIndex + 1;

                  if (!chunk || !chunk.startsWith('data: ')) continue;

                  const data = chunk.replace('data: ', '').trim();
                  if (data === '[DONE]') {
                    return { done: true, value: undefined };
                  }

                  try {
                    const response = JSON.parse(data) as DeepseekStreamChunk;
                    if (startIndex >= buffer.length) {
                      buffer = '';
                    } else {
                      buffer = buffer.slice(startIndex);
                    }
                    return { done: false, value: response };
                  } catch (parseError) {
                    console.warn('解析流式响应块失败，跳过此块:', chunk);
                    continue;
                  }
                }

                // 如果缓冲区过大，可能表示数据损坏，清空缓冲区
                if (buffer.length > 100000) { // 100KB
                  console.warn('流式响应缓冲区过大，清空缓冲区');
                  buffer = '';
                  throw new LLMError(
                    '流式响应缓冲区溢出',
                    LLMErrorCode.API_ERROR,
                    this.adapter.getProviderName()
                  );
                }
              }
            } catch (error) {
              // 清理资源
              try {
                await reader.cancel();
              } catch {}

              if (error instanceof LLMError) {
                throw error;
              }

              throw new LLMError(
                '解析流式响应失败',
                LLMErrorCode.API_ERROR,
                this.adapter.getProviderName(),
                error as Error
              );
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

    console.log('正在获取 Deepseek 模型列表...');
    console.log('请求配置:', {
      url: `${this.config.baseUrl}/v1/models`,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...(this.config.organizationId ? {
          'Deepseek-Organization': this.config.organizationId
        } : {})
      }
    });

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...(this.config.organizationId ? {
            'Deepseek-Organization': this.config.organizationId
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
      // {
      //   "object": "list",
      //   "data": [
      //     {
      //       "id": "deepseek-chat",
      //       "object": "model",
      //       "owned_by": "deepseek"
      //     }
      //   ]
      // }
      if (data.object === 'list' && Array.isArray(data.data)) {
        const models = data.data
          .filter((model: any) => model.object === 'model')
          .map((model: any) => model.id);
        console.log('解析出的可用模型:', models);
        return models;
      } else {
        console.error('模型列表数据格式不正确:', data);
        throw new LLMError(
          '模型列表数据格式不正确',
          LLMErrorCode.API_ERROR,
          this.getProviderName()
        );
      }
    } catch (error) {
      console.error('获取模型列表时发生错误:', error);
      throw error;
    }
  }
} 