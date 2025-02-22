import { BaseProviderAdapter } from './base';
import type { ChatRequest, ChatResponse } from '../api/types';
import { PROVIDERS } from '../types/providers';

interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}

interface OpenAIStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    delta: {
      content?: string;
    };
    index: number;
    finish_reason: string | null;
  }>;
}

export class OpenAIAdapter extends BaseProviderAdapter<OpenAIRequest, OpenAIResponse | OpenAIStreamResponse> {
  adaptRequest(request: ChatRequest): OpenAIRequest {
    if (!request.model) {
      throw new Error('Model is required for OpenAI requests');
    }

    const messages: OpenAIMessage[] = [];
    
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
      model: request.model,
      messages,
      stream: request.stream,
      temperature: request.temperature,
      top_p: request.topP,
      max_tokens: request.maxTokens
    };
  }

  adaptResponse(response: OpenAIResponse | OpenAIStreamResponse): ChatResponse {
    if ('delta' in response.choices[0]) {
      // 处理流式响应
      const streamResponse = response as OpenAIStreamResponse;
      return {
        content: streamResponse.choices[0].delta.content || '',
        metadata: {
          modelId: streamResponse.model,
          provider: PROVIDERS.OPENAI,
          timestamp: streamResponse.created * 1000,
          requestId: streamResponse.id
        }
      };
    } else {
      // 处理普通响应
      const normalResponse = response as OpenAIResponse;
      return {
        content: normalResponse.choices[0].message.content,
        metadata: {
          modelId: normalResponse.model,
          provider: PROVIDERS.OPENAI,
          timestamp: normalResponse.created * 1000,
          requestId: normalResponse.id
        }
      };
    }
  }

  async *adaptStream(stream: AsyncGenerator<OpenAIResponse | OpenAIStreamResponse>): AsyncGenerator<ChatResponse> {
    for await (const chunk of stream) {
      if ('delta' in chunk.choices[0]) {
        const content = (chunk as OpenAIStreamResponse).choices[0]?.delta?.content;
        if (content) {
          yield {
            content,
            metadata: {
              modelId: chunk.model,
              provider: PROVIDERS.OPENAI,
              timestamp: chunk.created * 1000,
              requestId: chunk.id
            }
          };
        }
      }
    }
  }
} 