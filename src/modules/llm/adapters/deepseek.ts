import { BaseProviderAdapter } from './base';
import type { ChatRequest, ChatResponse } from '../api/types';
import { PROVIDERS } from '../types/providers';

interface DeepseekMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface DeepseekRequest {
  model: string;
  messages: DeepseekMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

interface DeepseekResponse {
  id: string;
  object: 'chat.completion' | 'chat.completion.chunk';
  created: number;
  model: string;
  choices: {
    index: number;
    message?: {
      role: string;
      content: string;
    };
    delta?: {
      content: string | null;
    };
    finish_reason: 'stop' | 'length' | 'function_call' | null;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepseekAdapter extends BaseProviderAdapter<DeepseekRequest, DeepseekResponse> {
  adaptRequest(request: ChatRequest): DeepseekRequest {
    if (!request.model) {
      throw new Error('未指定模型');
    }

    const messages: DeepseekMessage[] = [];
    
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

    const requestConfig: DeepseekRequest = {
      model: request.model,
      messages,
      temperature: request.temperature ?? 0.7,
      top_p: request.topP ?? 1.0,
      max_tokens: request.maxTokens ?? 2048
    };

    if (request.stream) {
      requestConfig.stream = true;
    }

    console.log('Deepseek request config:', JSON.stringify(requestConfig, null, 2));
    return requestConfig;
  }

  adaptResponse(response: DeepseekResponse): ChatResponse {
    if (!response.choices || response.choices.length === 0) {
      return {
        content: null,
        timestamp: Date.now()
      };
    }

    const choice = response.choices[0];
    const content = choice.delta?.content ?? choice.message?.content ?? null;
    
    return {
      content,
      timestamp: response.created * 1000,
      metadata: {
        modelId: response.model,
        provider: PROVIDERS.DEEPSEEK,
        usage: response.usage,
        finishReason: choice.finish_reason
      }
    };
  }

  async *adaptStream(stream: AsyncGenerator<DeepseekResponse>): AsyncGenerator<ChatResponse> {
    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const choice = chunk.choices[0];
        const content = choice.delta?.content ?? choice.message?.content ?? null;
        
        if (content !== null) {
          yield {
            content,
            timestamp: chunk.created * 1000,
            metadata: {
              modelId: chunk.model,
              provider: PROVIDERS.DEEPSEEK,
              finishReason: choice.finish_reason
            }
          };
        }
      }
    }
  }

  static adaptStreamChunk(chunk: string): ChatResponse | null {
    try {
      if (chunk === '[DONE]' || chunk.trim() === '') {
        return null;
      }

      const data = JSON.parse(chunk);
      if (!data.choices || data.choices.length === 0) {
        return null;
      }

      const choice = data.choices[0];
      const content = choice.delta?.content ?? choice.message?.content ?? null;
      
      if (content === null) {
        return null;
      }

      return {
        content,
        timestamp: data.created * 1000,
        metadata: {
          modelId: data.model,
          provider: PROVIDERS.DEEPSEEK,
          finishReason: choice.finish_reason
        }
      };
    } catch (error) {
      console.error('解析流式响应失败:', error, '\n原始数据:', chunk);
      return null;
    }
  }
} 