import { UnifiedLLMService } from './UnifiedLLMService';
import type { ChatRequest, ChatResponse } from '../api/types';
import type { ModelConfig } from '../types/config';
import { LLMError, LLMErrorCode } from '../types/error';

export interface TestContext {
  topic?: {
    title: string;
    background: string;
  };
  currentRound?: number;
  totalRounds?: number;
  previousSpeeches?: Array<{
    id: string;
    playerId: string;
    content: string;
    timestamp: string;
    round: number;
    references: string[];
  }>;
}

export interface TestRequest {
  input: string;
  prompt?: string;
  modelConfig: ModelConfig;
  context?: TestContext;
  stream?: boolean;
}

export interface TestResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export class TestService {
  constructor(private llmService: UnifiedLLMService) {}

  /**
   * 执行测试
   */
  public async test(request: TestRequest): Promise<TestResponse> {
    console.group('=== TestService Test Request ===');
    console.log('Request:', request);
    try {
      const provider = await this.llmService.getInitializedProvider(request.modelConfig);
      const response = await provider.chat({
        message: request.input,
        systemPrompt: request.prompt,
        temperature: request.modelConfig.parameters.temperature,
        maxTokens: request.modelConfig.parameters.maxTokens,
        topP: request.modelConfig.parameters.topP
      });
      
      console.log('LLM Response:', response);
      return this.adaptResponse(response);
    } catch (error) {
      console.error('TestService Error:', error);
      throw this.handleError(error);
    } finally {
      console.groupEnd();
    }
  }

  /**
   * 执行流式测试
   */
  public async *testStream(request: TestRequest): AsyncGenerator<string> {
    console.group('=== TestService Stream Request ===');
    console.log('Request:', request);
    try {
      const provider = await this.llmService.getInitializedProvider(request.modelConfig);
      const stream = provider.stream({
        message: request.input,
        systemPrompt: request.prompt,
        temperature: request.modelConfig.parameters.temperature,
        maxTokens: request.modelConfig.parameters.maxTokens,
        topP: request.modelConfig.parameters.topP
      });

      console.log('Stream Started');
      let isInReasoningBlock = false;
      let reasoningBuffer = '';
      let contentBuffer = '';

      for await (const response of stream) {
        console.log('Stream Chunk:', response);
        const chunk = response.content;

        // 处理推理内容
        if (chunk.includes('<think>')) {
          if (contentBuffer) {
            yield contentBuffer;
            contentBuffer = '';
          }
          yield '[[REASONING_START]]';
          isInReasoningBlock = true;
          continue;
        }

        if (chunk.includes('</think>')) {
          if (reasoningBuffer) {
            yield reasoningBuffer;
            reasoningBuffer = '';
          }
          yield '[[REASONING_END]]';
          isInReasoningBlock = false;
          continue;
        }

        // 根据当前模式，将内容添加到对应的缓冲区
        if (isInReasoningBlock) {
          reasoningBuffer += chunk;
          if (reasoningBuffer.length > 100) {
            yield reasoningBuffer;
            reasoningBuffer = '';
          }
        } else {
          contentBuffer += chunk;
          if (contentBuffer.length > 100) {
            yield contentBuffer;
            contentBuffer = '';
          }
        }
      }

      // 输出剩余的缓冲区内容
      if (isInReasoningBlock && reasoningBuffer) {
        yield reasoningBuffer;
        yield '[[REASONING_END]]';
      } else if (contentBuffer) {
        yield contentBuffer;
      }

      console.log('Stream Completed');
    } catch (error) {
      console.error('TestService Stream Error:', error);
      throw this.handleError(error);
    } finally {
      console.groupEnd();
    }
  }

  /**
   * 转换响应
   */
  private adaptResponse(response: ChatResponse): TestResponse {
    return {
      content: response.content,
      metadata: response.metadata
    };
  }

  /**
   * 处理错误
   */
  private handleError(error: unknown): LLMError {
    if (error instanceof LLMError) {
      return error;
    }

    return new LLMError(
      LLMErrorCode.UNKNOWN,
      'test_service',
      error instanceof Error ? error : undefined
    );
  }
} 