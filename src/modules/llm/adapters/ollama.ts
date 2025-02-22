import { BaseProviderAdapter } from './base';
import type { ChatRequest, ChatResponse } from '../api/types';
import { PROVIDERS } from '../types/providers';

interface OllamaRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
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
    const messages: OllamaRequest['messages'] = [];
    
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
      model: request.model || (() => {
        throw new Error('Model is required for Ollama requests');
      })(),
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