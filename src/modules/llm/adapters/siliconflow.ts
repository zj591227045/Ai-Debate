import { BaseProviderAdapter } from './base';
import type { ChatRequest, ChatResponse } from '../api/types';
import { PROVIDERS } from '../types/providers';
import { Message } from '../types/common';

interface SiliconFlowMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SiliconFlowRequest {
  model: string;
  messages: SiliconFlowMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  n?: number;
}

interface SiliconFlowResponse {
  id: string;
  object: 'chat.completion' | 'chat.completion.chunk';
  created: number;
  model: string;
  choices: {
    index: number;
    message?: {
      role: string;
      content: string;
      reasoning_content?: string | null;
    };
    delta?: {
      content: string | null;
      reasoning_content: string | null;
    };
    finish_reason: 'stop' | 'length' | 'tool_calls' | null;
    content_filter_results: {
      hate: { filtered: boolean };
      self_harm: { filtered: boolean };
      sexual: { filtered: boolean };
      violence: { filtered: boolean };
    };
  }[];
  system_fingerprint: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class SiliconFlowAdapter extends BaseProviderAdapter<SiliconFlowRequest, SiliconFlowResponse> {
  adaptRequest(request: ChatRequest): SiliconFlowRequest {
    if (!request.model) {
      throw new Error('未指定模型');
    }

    const messages: SiliconFlowMessage[] = [];
    
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

    // 构建请求配置
    const requestConfig: SiliconFlowRequest = {
      model: request.model,
      messages,
      temperature: request.temperature ?? 0.7,
      top_p: request.topP ?? 1.0,
      max_tokens: request.maxTokens ?? 2048,
      frequency_penalty: 0,
      n: 1
    };

    // 如果是流式请求，添加stream参数
    if (request.stream) {
      requestConfig.stream = true;
    }

    console.log('SiliconFlow request config:', JSON.stringify(requestConfig, null, 2));
    return requestConfig;
  }

  adaptResponse(response: SiliconFlowResponse): ChatResponse {
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
        provider: PROVIDERS.SILICONFLOW,
        reasoning: choice.delta?.reasoning_content ?? choice.message?.reasoning_content ?? null,
        usage: response.usage,
        finishReason: choice.finish_reason
      }
    };
  }

  async *adaptStream(stream: AsyncGenerator<SiliconFlowResponse>): AsyncGenerator<ChatResponse> {
    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const choice = chunk.choices[0];
        const content = choice.delta?.content ?? choice.message?.content ?? null;
        const reasoningContent = choice.delta?.reasoning_content ?? choice.message?.reasoning_content ?? null;
        
        if (content !== null || reasoningContent !== null) {
          yield {
            content,
            timestamp: chunk.created * 1000,
            metadata: {
              modelId: chunk.model,
              provider: PROVIDERS.SILICONFLOW,
              reasoning: reasoningContent,
              finishReason: choice.finish_reason
            }
          };
        }
      }
    }
  }

  static adaptRequest(request: ChatRequest): any {
    return {
      message: request.message,
      model: request.model,
      stream: request.stream || false,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
    };
  }

  static adaptResponse(response: any): ChatResponse {
    return {
      content: response.choices[0]?.message?.content || null,
      timestamp: Date.now(),
      metadata: {
        modelId: response.model,
        provider: 'siliconflow',
      }
    };
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
      const reasoningContent = choice.delta?.reasoning_content ?? choice.message?.reasoning_content ?? null;
      
      if (content !== null || reasoningContent !== null) {
        return {
          content,
          timestamp: data.created * 1000,
          metadata: {
            modelId: data.model,
            provider: PROVIDERS.SILICONFLOW,
            reasoning: reasoningContent,
            finishReason: choice.finish_reason
          }
        };
      }
      return null;
    } catch (error) {
      console.error('解析流式响应失败:', error, '\n原始数据:', chunk);
      return null;
    }
  }
} 