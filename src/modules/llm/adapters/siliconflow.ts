import { BaseProviderAdapter } from './base';
import type { ChatRequest, ChatResponse } from '../api/types';
import { PROVIDERS } from '../types/providers';

interface SiliconFlowRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

interface SiliconFlowResponse {
  id: string;
  choices: Array<{
    text: string;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class SiliconFlowAdapter extends BaseProviderAdapter<SiliconFlowRequest, SiliconFlowResponse> {
  adaptRequest(request: ChatRequest): SiliconFlowRequest {
    const prompt = request.systemPrompt 
      ? `${request.systemPrompt}\n\n${request.message}`
      : request.message;

    return {
      model: request.model || 'silicon-chat',
      prompt,
      stream: request.stream,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP
    };
  }

  adaptResponse(response: SiliconFlowResponse): ChatResponse {
    return {
      content: response.choices[0].text,
      metadata: {
        modelId: response.id,
        provider: PROVIDERS.SILICONFLOW,
        timestamp: Date.now(),
        tokensUsed: {
          prompt: response.usage.prompt_tokens,
          completion: response.usage.completion_tokens,
          total: response.usage.total_tokens
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