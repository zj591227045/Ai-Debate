import { BaseProviderAdapter } from './base';
import type { ChatRequest, ChatResponse } from '../api/types';
import { PROVIDERS } from '../types/providers';

interface OllamaRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
  };
}

interface OllamaResponse {
  model: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  created_at: string;
}

export class OllamaAdapter extends BaseProviderAdapter<OllamaRequest, OllamaResponse> {
  adaptRequest(request: ChatRequest): OllamaRequest {
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

    return {
      model: request.model || 'qwen2.5',
      messages,
      stream: request.stream,
      options: {
        temperature: request.temperature,
        top_p: request.topP,
        num_predict: request.maxTokens
      }
    };
  }

  adaptResponse(response: OllamaResponse): ChatResponse {
    return {
      content: response.message.content,
      metadata: {
        modelId: response.model,
        provider: PROVIDERS.OLLAMA,
        timestamp: new Date(response.created_at).getTime()
      }
    };
  }

  async *adaptStream(stream: AsyncGenerator<OllamaResponse>): AsyncGenerator<ChatResponse> {
    for await (const chunk of stream) {
      yield this.adaptResponse(chunk);
    }
  }
} 