/**
 * LLM错误类型定义
 */

/**
 * LLM错误码枚举
 */
export enum LLMErrorCode {
  UNKNOWN = 'UNKNOWN',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  REQUEST_FAILED = 'REQUEST_FAILED',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STREAM_ERROR = 'STREAM_ERROR',
  TIMEOUT = 'TIMEOUT',
  ABORTED = 'ABORTED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  BUFFER_OVERFLOW = 'BUFFER_OVERFLOW',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOKEN_LIMIT_EXCEEDED = 'TOKEN_LIMIT_EXCEEDED',
  TEST_FAILED = 'TEST_FAILED',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND'
}

/**
 * LLM错误类
 */
export class LLMError extends Error {
  constructor(
    public readonly code: LLMErrorCode,
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'LLMError';
  }

  static modelNotFound(modelId: string): LLMError {
    return new LLMError(
      LLMErrorCode.MODEL_NOT_FOUND,
      `Model ${modelId} not found`,
    );
  }

  static providerError(provider: string, details: any): LLMError {
    return new LLMError(
      LLMErrorCode.PROVIDER_NOT_FOUND,
      `Provider ${provider} not found`,
      details
    );
  }

  static networkError(details: any): LLMError {
    return new LLMError(
      LLMErrorCode.NETWORK_ERROR,
      'Network error',
      details
    );
  }

  static timeout(timeoutMs: number): LLMError {
    return new LLMError(
      LLMErrorCode.TIMEOUT,
      `Request timed out after ${timeoutMs}ms`,
    );
  }

  static invalidRequest(message: string): LLMError {
    return new LLMError(
      LLMErrorCode.REQUEST_FAILED,
      message,
    );
  }

  /**
   * 获取错误详情
   */
  getDetails(): Record<string, any> {
    return {
      code: this.code,
      message: this.message,
      cause: this.cause,
      stack: this.stack
    };
  }

  /**
   * 格式化错误信息
   */
  toString(): string {
    return `[${this.code}] ${this.message}`;
  }
}

export default LLMError;