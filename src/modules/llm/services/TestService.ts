import { UnifiedLLMService } from './UnifiedLLMService';
import { LLMRequest, LLMResponse, ModelConfig } from '../types';
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
  private static instance: TestService;
  private llmService: UnifiedLLMService;

  private constructor() {
    console.log('=== TestService Initialized ===');
    this.llmService = new UnifiedLLMService();
  }

  public static getInstance(): TestService {
    if (!TestService.instance) {
      TestService.instance = new TestService();
    }
    return TestService.instance;
  }

  /**
   * 执行测试
   */
  public async test(request: TestRequest): Promise<TestResponse> {
    console.group('=== TestService Test Request ===');
    console.log('Request:', request);
    try {
      const llmRequest = this.adaptRequest(request);
      console.log('Adapted Request:', llmRequest);
      const response = await this.llmService.generateCompletion(llmRequest);
      console.log('LLM Response:', response);
      const adaptedResponse = this.adaptResponse(response);
      console.log('Adapted Response:', adaptedResponse);
      console.groupEnd();
      return adaptedResponse;
    } catch (error) {
      console.error('TestService Error:', error);
      console.groupEnd();
      throw this.handleError(error);
    }
  }

  /**
   * 执行流式测试
   */
  public async *testStream(request: TestRequest): AsyncGenerator<string> {
    console.group('=== TestService Stream Request ===');
    console.log('Request:', request);
    try {
      const llmRequest = this.adaptRequest({ ...request, stream: true });
      console.log('Adapted Request:', llmRequest);
      const stream = await this.llmService.generateStream(llmRequest);
      
      if (!stream) {
        throw new LLMError(
          '当前模型不支持流式输出',
          LLMErrorCode.API_ERROR,
          request.modelConfig.provider
        );
      }

      console.log('Stream Started');
      let isInReasoningBlock = false;
      let reasoningBuffer = '';
      let contentBuffer = '';

      for await (const chunk of stream) {
        console.log('Stream Chunk:', chunk);

        // 尝试解析 JSON 格式的响应
        try {
          if (chunk.startsWith('data: ')) {
            const jsonStr = chunk.slice(6); // 移除 'data: ' 前缀
            const jsonData = JSON.parse(jsonStr);
            
            // 检查是否有 choices 数组且包含 delta
            if (jsonData.choices?.[0]?.delta) {
              const { content, reasoning_content } = jsonData.choices[0].delta;
              
              // 处理推理内容
              if (reasoning_content !== null && reasoning_content !== undefined) {
                if (!isInReasoningBlock) {
                  // 如果之前有内容，先输出
                  if (contentBuffer) {
                    yield contentBuffer;
                    contentBuffer = '';
                  }
                  // 切换到推理模式
                  yield '[[REASONING_START]]';
                  isInReasoningBlock = true;
                }
                reasoningBuffer += reasoning_content;
                if (reasoningBuffer.length > 100) {
                  yield reasoningBuffer;
                  reasoningBuffer = '';
                }
                continue;
              }
              
              // 处理普通内容
              if (content !== null && content !== undefined) {
                if (isInReasoningBlock) {
                  // 如果之前有推理内容，先输出
                  if (reasoningBuffer) {
                    yield reasoningBuffer;
                    reasoningBuffer = '';
                  }
                  // 切换回普通模式
                  yield '[[REASONING_END]]';
                  isInReasoningBlock = false;
                }
                contentBuffer += content;
                if (contentBuffer.length > 100) {
                  yield contentBuffer;
                  contentBuffer = '';
                }
                continue;
              }
            }
            continue; // 如果是 JSON 格式但没有相关内容，跳过后续处理
          }
        } catch (e) {
          // 如果解析 JSON 失败，按普通文本处理
          console.log('非 JSON 格式的响应，按普通文本处理');
        }

        // 处理普通文本格式的响应（包含 <think> 标记的情况）
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
      console.groupEnd();
    } catch (error) {
      console.error('TestService Stream Error:', error);
      console.groupEnd();
      throw this.handleError(error);
    }
  }

  /**
   * 转换请求
   */
  private adaptRequest(request: TestRequest): LLMRequest {
    let prompt = request.prompt || '';

    // 如果有上下文，构建上下文相关的prompt
    if (request.context) {
      prompt = this.buildContextPrompt(request.context, prompt);
    }

    return {
      prompt,
      input: request.input,
      modelConfig: request.modelConfig,
      parameters: {
        ...request.modelConfig.parameters,
        stream: request.stream
      }
    };
  }

  /**
   * 转换响应
   */
  private adaptResponse(response: LLMResponse): TestResponse {
    return {
      content: response.content,
      usage: response.usage,
      metadata: response.metadata
    };
  }

  /**
   * 构建上下文prompt
   */
  private buildContextPrompt(context: TestContext, basePrompt: string): string {
    const parts: string[] = [];

    // 添加基础prompt
    if (basePrompt) {
      parts.push(basePrompt);
    }

    // 添加主题信息
    if (context.topic) {
      parts.push(`主题：${context.topic.title}`);
      if (context.topic.background) {
        parts.push(`背景：${context.topic.background}`);
      }
    }

    // 添加轮次信息
    if (context.currentRound !== undefined && context.totalRounds !== undefined) {
      parts.push(`当前轮次：${context.currentRound}/${context.totalRounds}`);
    }

    // 添加历史发言
    if (context.previousSpeeches && context.previousSpeeches.length > 0) {
      parts.push('\n历史发言：');
      context.previousSpeeches.forEach(speech => {
        parts.push(`[${speech.timestamp}] ${speech.content}`);
      });
    }

    return parts.join('\n\n');
  }

  /**
   * 处理错误
   */
  private handleError(error: unknown): LLMError {
    if (error instanceof LLMError) {
      return error;
    }

    return new LLMError(
      error instanceof Error ? error.message : '未知错误',
      LLMErrorCode.UNKNOWN,
      'test_service',
      error instanceof Error ? error : undefined
    );
  }
} 