/**
 * Ollama适配器实现
 */

import { BaseProviderAdapter } from './base';
import { LLMRequest, LLMResponse } from '../types';
import { OllamaConfig } from '../types/providers';
import { LLMError, LLMErrorCode } from '../types/error';

interface OllamaApiRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    seed?: number;
    num_predict?: number;
    stop?: string[];
  };
}

interface OllamaApiResponse {
  model: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaStreamIterator extends AsyncIterator<OllamaApiResponse> {
  adapter: OllamaAdapter;
}

export class OllamaAdapter extends BaseProviderAdapter<OllamaConfig> {
  public getProviderName(): string {
    return 'ollama';
  }

  protected async validateProviderConfig(config: OllamaConfig, skipModelValidation?: boolean): Promise<void> {
    if (!config.baseUrl) {
      throw new LLMError(
        'Ollama服务地址未配置',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    if (!skipModelValidation && !config.model) {
      throw new LLMError(
        'Ollama模型未指定',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    // 测试连接
    try {
      const response = await fetch(`${config.baseUrl}/api/version`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      throw new LLMError(
        'Ollama服务连接失败',
        LLMErrorCode.API_ERROR,
        this.getProviderName(),
        error as Error
      );
    }
  }

  protected async transformRequest(request: LLMRequest): Promise<OllamaApiRequest> {
    if (!this.config) {
      throw new LLMError(
        '适配器未初始化',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    return {
      model: this.config.model,
      prompt: `${request.prompt}\n${request.input}`,
      stream: request.parameters?.stream,
      options: {
        temperature: request.parameters?.temperature,
        top_p: request.parameters?.topP,
        repeat_penalty: request.parameters?.presencePenalty,
        stop: request.parameters?.stop,
        num_predict: this.config.options?.num_predict,
        ...this.config.options
      }
    };
  }

  protected async transformResponse(response: OllamaApiResponse): Promise<LLMResponse> {
    return {
      content: response.response,
      usage: {
        promptTokens: response.prompt_eval_count || 0,
        completionTokens: response.eval_count || 0,
        totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
      },
      metadata: {
        model: response.model,
        totalDuration: response.total_duration,
        loadDuration: response.load_duration,
        evalDuration: response.eval_duration
      }
    };
  }

  protected async transformStreamResponse(chunk: OllamaApiResponse): Promise<string> {
    return chunk.response;
  }

  protected async callApi(request: OllamaApiRequest): Promise<OllamaApiResponse> {
    if (!this.config) {
      throw new LLMError(
        '适配器未初始化',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    const response = await fetch(`${this.config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new LLMError(
        `Ollama API调用失败: ${response.statusText}`,
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    }

    return await response.json();
  }

  protected async callStreamApi(request: OllamaApiRequest): Promise<AsyncIterable<OllamaApiResponse>> {
    if (!this.config) {
      throw new LLMError(
        '适配器未初始化',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    const response = await fetch(`${this.config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...request, stream: true })
    });

    if (!response.ok) {
      throw new LLMError(
        `Ollama API调用失败: ${response.statusText}`,
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    }

    if (!response.body) {
      throw new LLMError(
        'Ollama API返回空响应',
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const adapter = this;

    return {
      [Symbol.asyncIterator](): OllamaStreamIterator {
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
                      const response = JSON.parse(buffer.trim()) as OllamaApiResponse;
                      buffer = '';
                      return { done: false, value: response };
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

                  if (!chunk) continue;

                  try {
                    const response = JSON.parse(chunk) as OllamaApiResponse;
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

    const response = await fetch(`${this.config.baseUrl}/api/tags`);
    
    if (!response.ok) {
      throw new LLMError(
        `获取模型列表失败: ${response.statusText}`,
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    }

    const data = await response.json();
    return data.models?.map((model: any) => model.name) || [];
  }
} 