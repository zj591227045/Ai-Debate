import { LLMError, LLMErrorCode } from '../../types/error';

export interface RetryOptions {
  maxAttempts?: number;          // 最大重试次数
  initialDelayMs?: number;       // 初始延迟时间（毫秒）
  maxDelayMs?: number;          // 最大延迟时间（毫秒）
  backoffFactor?: number;       // 退避因子
  retryableErrors?: LLMErrorCode[]; // 可重试的错误类型
}

export interface RetryMetadata {
  attempts: number;             // 当前尝试次数
  totalDelayMs: number;        // 总延迟时间
  errors: Error[];             // 错误历史
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
  retryableErrors: [
    LLMErrorCode.NETWORK_ERROR,
    LLMErrorCode.TIMEOUT,
    LLMErrorCode.RATE_LIMIT_EXCEEDED,
    LLMErrorCode.API_ERROR
  ]
};

export class RetryHandler {
  private options: Required<RetryOptions>;
  private metadata: RetryMetadata;

  constructor(options: RetryOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.metadata = {
      attempts: 0,
      totalDelayMs: 0,
      errors: []
    };
  }

  /**
   * 执行带重试的异步操作
   */
  async execute<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    this.metadata.attempts = 0;
    this.metadata.totalDelayMs = 0;
    this.metadata.errors = [];

    while (this.metadata.attempts < this.options.maxAttempts) {
      try {
        if (this.metadata.attempts > 0) {
          const delayMs = this.calculateDelay();
          console.log(`[RetryHandler] 等待 ${delayMs}ms 后进行第 ${this.metadata.attempts + 1} 次重试${context ? ` (${context})` : ''}`);
          await this.delay(delayMs);
          this.metadata.totalDelayMs += delayMs;
        }

        this.metadata.attempts++;
        return await operation();
      } catch (error) {
        if (!this.shouldRetry(error)) {
          throw error;
        }

        this.metadata.errors.push(error as Error);
        console.warn(`[RetryHandler] 第 ${this.metadata.attempts} 次尝试失败${context ? ` (${context})` : ''}:`, error);

        if (this.metadata.attempts === this.options.maxAttempts) {
          throw new LLMError(
            LLMErrorCode.REQUEST_FAILED,
            `操作失败，已重试 ${this.metadata.attempts} 次`,
            error as Error
          );
        }
      }
    }

    throw new LLMError(
      LLMErrorCode.REQUEST_FAILED,
      '重试次数已达上限'
    );
  }

  /**
   * 执行带重试的异步生成器操作
   */
  async *executeGenerator<T>(
    generator: () => AsyncGenerator<T>,
    context?: string
  ): AsyncGenerator<T> {
    this.metadata.attempts = 0;
    this.metadata.totalDelayMs = 0;
    this.metadata.errors = [];

    while (this.metadata.attempts < this.options.maxAttempts) {
      try {
        if (this.metadata.attempts > 0) {
          const delayMs = this.calculateDelay();
          console.log(`[RetryHandler] 等待 ${delayMs}ms 后进行第 ${this.metadata.attempts + 1} 次重试${context ? ` (${context})` : ''}`);
          await this.delay(delayMs);
          this.metadata.totalDelayMs += delayMs;
        }

        this.metadata.attempts++;
        yield* generator();
        return;
      } catch (error) {
        if (!this.shouldRetry(error)) {
          throw error;
        }

        this.metadata.errors.push(error as Error);
        console.warn(`[RetryHandler] 第 ${this.metadata.attempts} 次尝试失败${context ? ` (${context})` : ''}:`, error);

        if (this.metadata.attempts === this.options.maxAttempts) {
          throw new LLMError(
            LLMErrorCode.REQUEST_FAILED,
            `流式操作失败，已重试 ${this.metadata.attempts} 次`,
            error as Error
          );
        }
      }
    }
  }

  /**
   * 计算下一次重试的延迟时间
   */
  private calculateDelay(): number {
    const exponentialDelay = this.options.initialDelayMs * 
      Math.pow(this.options.backoffFactor, this.metadata.attempts - 1);
    
    // 添加随机抖动（±25%）
    const jitter = exponentialDelay * (0.75 + Math.random() * 0.5);
    
    return Math.min(jitter, this.options.maxDelayMs);
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: unknown): boolean {
    if (error instanceof LLMError) {
      return this.options.retryableErrors.includes(error.code);
    }
    // 对于网络错误等通用错误也进行重试
    return error instanceof Error && (
      error.name === 'NetworkError' ||
      error.name === 'TimeoutError' ||
      error.message.toLowerCase().includes('timeout') ||
      error.message.toLowerCase().includes('network')
    );
  }

  /**
   * 延迟执行
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取重试元数据
   */
  getMetadata(): RetryMetadata {
    return { ...this.metadata };
  }

  /**
   * 重置重试状态
   */
  reset(): void {
    this.metadata = {
      attempts: 0,
      totalDelayMs: 0,
      errors: []
    };
  }
} 