import { BaseProviderAdapter } from './base';
import type { ChatRequest, ChatResponse } from '../api/types';
import { PROVIDERS } from '../types/providers';

interface SiliconFlowRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

interface SiliconFlowResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message?: {
      role: string;
      content: string;
    };
    delta?: {
      role?: string;
      content?: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class SiliconFlowAdapter extends BaseProviderAdapter<SiliconFlowRequest, SiliconFlowResponse> {
  adaptRequest(request: ChatRequest): SiliconFlowRequest {
    const messages = [];
    
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: request.message
    });

    if (!request.model) {
      throw new Error('未指定模型');
    }

    // 构建请求配置
    const requestConfig: SiliconFlowRequest = {
      model: request.model,
      messages,
      temperature: request.temperature || 0.7,
      top_p: request.topP || 0.9,
      max_tokens: request.maxTokens || 2000
    };

    // 如果是流式请求，添加stream参数
    if (request.stream) {
      requestConfig.stream = true;
    }

    console.log('SiliconFlow request config:', requestConfig);
    return requestConfig;
  }

  adaptResponse(response: SiliconFlowResponse): ChatResponse {
    // 处理流式响应
    if (response.choices?.[0]?.delta) {
      return {
        content: response.choices[0].delta.content || '',
        metadata: {
          modelId: response.id,
          provider: PROVIDERS.SILICONFLOW,
          timestamp: response.created,
          tokensUsed: response.usage ? {
            prompt: response.usage.prompt_tokens,
            completion: response.usage.completion_tokens,
            total: response.usage.total_tokens
          } : {
            prompt: 0,
            completion: 0,
            total: 0
          }
        }
      };
    }
    
    // 处理普通响应
    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('响应内容为空');
    }

    return {
      content,
      metadata: {
        modelId: response.id,
        provider: PROVIDERS.SILICONFLOW,
        timestamp: response.created,
        tokensUsed: response.usage ? {
          prompt: response.usage.prompt_tokens,
          completion: response.usage.completion_tokens,
          total: response.usage.total_tokens
        } : {
          prompt: 0,
          completion: 0,
          total: 0
        }
      }
    };
  }

  async *adaptStream(stream: AsyncGenerator<SiliconFlowResponse>): AsyncGenerator<ChatResponse> {
    for await (const chunk of stream) {
      yield this.adaptResponse(chunk);
    }
  }
} 