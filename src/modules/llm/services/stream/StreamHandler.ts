import { LLMError, LLMErrorCode } from '../../types/error';
import type { ChatResponse } from '../../api/types';

export interface StreamOptions {
  timeoutMs?: number;
  maxBufferSize?: number;
  retryAttempts?: number;
  signal?: AbortSignal;
}

export interface StreamMetadata {
  startTime: number;
  lastChunkTime?: number;
  totalChunks: number;
  bufferSize: number;
}

const DEFAULT_OPTIONS: Required<Omit<StreamOptions, 'signal'>> & { signal: AbortSignal | undefined } = {
  timeoutMs: 30000,        // 30秒超时
  maxBufferSize: 1048576,  // 1MB缓冲区限制
  retryAttempts: 3,        // 最大重试次数
  signal: undefined
};

export class StreamHandler {
  private metadata: StreamMetadata;
  private options: typeof DEFAULT_OPTIONS;
  private buffer: string;

  constructor(options: StreamOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.metadata = {
      startTime: Date.now(),
      totalChunks: 0,
      bufferSize: 0
    };
    this.buffer = '';
  }

  async *handleStream(
    generator: AsyncGenerator<ChatResponse>,
  ): AsyncGenerator<ChatResponse> {
    try {
      // 使用超时和中断控制包装生成器
      const controlledGenerator = this.wrapWithControls(generator);

      for await (const chunk of controlledGenerator) {
        // 更新元数据
        this.metadata.lastChunkTime = Date.now();
        this.metadata.totalChunks++;

        // 处理响应数据
        const processedChunk = await this.processChunk(chunk);
        if (processedChunk) {
          yield processedChunk;
        }
      }
    } catch (error) {
      // 错误恢复处理
      const recoveryResponse = await this.handleError(error);
      if (recoveryResponse) {
        yield recoveryResponse;
      }
      throw error; // 重新抛出错误供上层处理
    }
  }

  private async *wrapWithControls(
    generator: AsyncGenerator<ChatResponse>
  ): AsyncGenerator<ChatResponse> {
    const { timeoutMs, signal } = this.options;

    while (true) {
      try {
        // 创建超时Promise
        const timeout = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new LLMError(
              LLMErrorCode.TIMEOUT,
              `响应超时 (${timeoutMs}ms)`
            ));
          }, timeoutMs);
        });

        // 创建中断Promise
        const abort = new Promise<never>((_, reject) => {
          signal?.addEventListener('abort', () => {
            reject(new LLMError(
              LLMErrorCode.ABORTED,
              '流生成被中断'
            ));
          });
        });

        // 获取下一个值
        const { value, done } = await Promise.race([
          generator.next(),
          timeout,
          abort
        ]);

        if (done) {
          break;
        }

        yield value;
      } catch (error) {
        if (error instanceof LLMError) {
          throw error;
        }
        throw new LLMError(
          LLMErrorCode.STREAM_ERROR,
          '流处理错误',
          error as Error
        );
      }
    }
  }

  private async processChunk(chunk: ChatResponse): Promise<ChatResponse | null> {
    // 验证响应格式
    if (!this.isValidResponse(chunk)) {
      throw new LLMError(
        LLMErrorCode.INVALID_RESPONSE,
        '无效的响应格式'
      );
    }

    // 更新缓冲区
    this.buffer += chunk.content || '';
    this.metadata.bufferSize = this.buffer.length;

    // 检查缓冲区大小
    if (this.metadata.bufferSize > this.options.maxBufferSize) {
      throw new LLMError(
        LLMErrorCode.BUFFER_OVERFLOW,
        `响应数据超过缓冲区限制 (${this.options.maxBufferSize} bytes)`
      );
    }

    return chunk;
  }

  private async handleError(error: unknown): Promise<ChatResponse | null> {
    // 如果已经有部分响应，尝试返回已有内容
    const partialResponse = this.createPartialResponse();
    
    if (error instanceof LLMError) {
      switch (error.code) {
        case LLMErrorCode.TIMEOUT:
          return this.createErrorResponse(
            partialResponse,
            '响应超时，返回部分结果'
          );

        case LLMErrorCode.BUFFER_OVERFLOW:
          return this.createErrorResponse(
            partialResponse,
            '响应过长，返回部分结果'
          );

        case LLMErrorCode.ABORTED:
          return this.createErrorResponse(
            partialResponse,
            '生成被中断，返回部分结果'
          );

        case LLMErrorCode.INVALID_RESPONSE:
          return this.createErrorResponse(
            partialResponse,
            '响应格式错误，返回部分结果'
          );

        default:
          return this.createErrorResponse(
            partialResponse,
            '发生错误，返回部分结果'
          );
      }
    }

    // 处理其他类型的错误
    return this.createErrorResponse(
      partialResponse,
      '发生未知错误，返回部分结果'
    );
  }

  private createPartialResponse(): string {
    return this.buffer || '';
  }

  private createErrorResponse(
    partialContent: string,
    errorMessage: string
  ): ChatResponse {
    const content = partialContent
      ? `${partialContent}\n[${errorMessage}]`
      : errorMessage;

    return {
      content,
      isError: true,
      timestamp: Date.now()
    };
  }

  private isValidResponse(response: ChatResponse): boolean {
    return (
      response &&
      typeof response === 'object' &&
      (
        typeof response.content === 'string' ||
        response.content === null ||
        response.content === undefined
      )
    );
  }

  // 获取流处理的元数据
  getMetadata(): StreamMetadata {
    return { ...this.metadata };
  }

  // 获取当前缓冲区内容
  getBuffer(): string {
    return this.buffer;
  }

  // 清理资源
  dispose(): void {
    this.buffer = '';
    this.metadata = {
      startTime: 0,
      totalChunks: 0,
      bufferSize: 0
    };
  }
} 