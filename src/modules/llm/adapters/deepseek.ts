import { BaseProviderAdapter } from './base';
import type { ChatRequest, ChatResponse } from '../api/types';
import { PROVIDERS } from '../types/providers';

interface DeepseekRequest {
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

interface DeepseekResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepseekAdapter extends BaseProviderAdapter<DeepseekRequest> {
  adaptRequest(request: ChatRequest): DeepseekRequest {
    return {
      model: request.model || 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: request.systemPrompt || '你是一个有帮助的AI助手。'
        },
        {
          role: 'user',
          content: request.message
        }
      ],
      stream: request.stream,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP
    };
  }

  adaptResponse(response: DeepseekResponse): ChatResponse {
    return {
      content: response.choices[0].message.content,
      metadata: {
        modelId: response.id,
        provider: PROVIDERS.DEEPSEEK,
        timestamp: Date.now(),
        tokensUsed: {
          prompt: response.usage.prompt_tokens,
          completion: response.usage.completion_tokens,
          total: response.usage.total_tokens
        }
      }
    };
  }

  async *adaptStream(stream: AsyncGenerator<DeepseekResponse>): AsyncGenerator<ChatResponse> {
    for await (const chunk of stream) {
      yield {
        content: chunk.choices[0].message.content,
        metadata: {
          modelId: chunk.id,
          provider: PROVIDERS.DEEPSEEK,
          timestamp: Date.now()
        }
      };
    }
  }
} 