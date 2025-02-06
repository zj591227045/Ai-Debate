/**
 * 火山引擎适配器实现
 */

import { BaseProviderAdapter } from './base';
import { LLMRequest, LLMResponse } from '../types';
import { VolcengineConfig } from '../types/providers';
import { LLMError, LLMErrorCode } from '../types/error';

interface VolcengineMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface VolcengineApiRequest {
  model: string;
  messages: VolcengineMessage[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
  stop?: string[];
  endpoint_id: string;
}

interface VolcengineApiResponse {
  request_id: string;
  code: number;
  message: string;
  data: {
    output: {
      text: string;
      tokens: number;
    };
    usage: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    };
  };
}

interface VolcengineStreamChunk {
  request_id: string;
  code: number;
  message: string;
  data: {
    output: {
      text: string;
      tokens: number;
    };
    is_end: boolean;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    };
  };
}

export class VolcengineAdapter extends BaseProviderAdapter<VolcengineConfig> {
  public getProviderName(): string {
    return 'volcengine';
  }

  protected async validateProviderConfig(config: VolcengineConfig): Promise<void> {
    if (!config.baseUrl) {
      throw new LLMError(
        '火山引擎API地址未配置',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    if (!config.apiKey) {
      throw new LLMError(
        '火山引擎API密钥未配置',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    if (!config.apiSecret) {
      throw new LLMError(
        '火山引擎API密钥未配置',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    if (!config.endpointId) {
      throw new LLMError(
        '火山引擎端点ID未配置',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    if (!config.model) {
      throw new LLMError(
        '火山引擎模型未指定',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    // 测试连接
    try {
      const response = await this.callApi({
        model: config.model,
        messages: [{ role: 'user', content: 'test' }],
        endpoint_id: config.endpointId,
        max_tokens: 1
      });
      if (response.code !== 0) {
        throw new Error(response.message);
      }
    } catch (error) {
      throw new LLMError(
        '火山引擎API连接失败',
        LLMErrorCode.API_ERROR,
        this.getProviderName(),
        error as Error
      );
    }
  }

  protected async transformRequest(request: LLMRequest): Promise<VolcengineApiRequest> {
    if (!this.config) {
      throw new LLMError(
        '适配器未初始化',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    const messages: VolcengineMessage[] = [
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
      stream: request.parameters?.stream,
      temperature: request.parameters?.temperature,
      max_tokens: request.parameters?.maxTokens,
      top_p: request.parameters?.topP,
      top_k: this.config.options?.topK,
      stop: request.parameters?.stop,
      endpoint_id: this.config.endpointId
    };
  }

  protected async transformResponse(response: VolcengineApiResponse): Promise<LLMResponse> {
    if (response.code !== 0) {
      throw new LLMError(
        `火山引擎API错误: ${response.message}`,
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    }

    return {
      content: response.data.output.text,
      usage: {
        promptTokens: response.data.usage.input_tokens,
        completionTokens: response.data.usage.output_tokens,
        totalTokens: response.data.usage.total_tokens
      },
      metadata: {
        requestId: response.request_id,
        tokens: response.data.output.tokens
      }
    };
  }

  protected async transformStreamResponse(chunk: VolcengineStreamChunk): Promise<string> {
    if (chunk.code !== 0) {
      throw new LLMError(
        `火山引擎API错误: ${chunk.message}`,
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    }

    return chunk.data.output.text;
  }

  protected async callApi(request: VolcengineApiRequest): Promise<VolcengineApiResponse> {
    if (!this.config) {
      throw new LLMError(
        '适配器未初始化',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.random().toString(36).substring(7);
    const signature = await this.generateSignature(
      this.config.apiSecret,
      timestamp,
      nonce
    );

    const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-Timestamp': timestamp.toString(),
        'X-Nonce': nonce,
        'X-Signature': signature
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new LLMError(
        `火山引擎API调用失败: ${response.statusText}`,
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    }

    return await response.json();
  }

  protected async callStreamApi(request: VolcengineApiRequest): Promise<AsyncIterable<VolcengineStreamChunk>> {
    if (!this.config) {
      throw new LLMError(
        '适配器未初始化',
        LLMErrorCode.INVALID_CONFIG,
        this.getProviderName()
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.random().toString(36).substring(7);
    const signature = await this.generateSignature(
      this.config.apiSecret,
      timestamp,
      nonce
    );

    const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-Timestamp': timestamp.toString(),
        'X-Nonce': nonce,
        'X-Signature': signature
      },
      body: JSON.stringify({ ...request, stream: true })
    });

    if (!response.ok) {
      throw new LLMError(
        `火山引擎API调用失败: ${response.statusText}`,
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    }

    if (!response.body) {
      throw new LLMError(
        '火山引擎API返回空响应',
        LLMErrorCode.API_ERROR,
        this.getProviderName()
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    return {
      [Symbol.asyncIterator]() {
        return {
          async next(): Promise<IteratorResult<VolcengineStreamChunk>> {
            try {
              while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                  return { done: true, value: undefined };
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';  // 保留最后一个不完整的行

                for (const line of lines) {
                  const trimmedLine = line.trim();
                  if (!trimmedLine) {
                    continue;
                  }

                  try {
                    const chunk = JSON.parse(trimmedLine) as VolcengineStreamChunk;
                    
                    if (chunk.code !== 0) {
                      throw new Error(chunk.message);
                    }

                    if (chunk.data.is_end) {
                      return { done: true, value: undefined };
                    }

                    return { done: false, value: chunk };
                  } catch {
                    continue;  // 忽略无效的JSON
                  }
                }
              }
            } catch (error) {
              throw new LLMError(
                '解析流式响应失败',
                LLMErrorCode.API_ERROR,
                'volcengine',
                error as Error
              );
            }
          }
        };
      }
    };
  }

  protected async fetchAvailableModels(): Promise<string[]> {
    // 火山引擎暂不支持获取可用模型列表
    return [this.config?.model || ''].filter(Boolean);
  }

  /**
   * 生成签名
   */
  private async generateSignature(
    secret: string,
    timestamp: number,
    nonce: string
  ): Promise<string> {
    const message = `${timestamp}${nonce}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );

    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
} 