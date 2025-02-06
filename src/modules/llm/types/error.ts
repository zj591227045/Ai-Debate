/**
 * LLM错误类型定义
 */

/**
 * LLM错误码枚举
 */
export enum LLMErrorCode {
  INVALID_CONFIG = 'INVALID_CONFIG',
  API_ERROR = 'API_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * LLM错误类
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public code: LLMErrorCode,
    public provider: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'LLMError';
  }

  /**
   * 获取错误详情
   */
  getDetails(): Record<string, any> {
    return {
      code: this.code,
      provider: this.provider,
      cause: this.cause?.message,
      stack: this.stack
    };
  }

  /**
   * 格式化错误信息
   */
  toString(): string {
    return `[${this.code}] ${this.message} (Provider: ${this.provider})${
      this.cause ? `\nCaused by: ${this.cause.message}` : ''
    }`;
  }
}