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
  API_ERROR = 'API_ERROR',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  PROVIDER_NOT_FOUND = 'PROVIDER_NOT_FOUND',
  STREAM_ERROR = 'STREAM_ERROR',
  TEST_FAILED = 'TEST_FAILED'
}

/**
 * LLM错误类
 */
export class LLMError extends Error {
  constructor(
    public code: LLMErrorCode,
    public provider: string,
    public originalError?: Error
  ) {
    super(code);
    this.name = 'LLMError';
  }

  static modelNotFound(modelId: string): LLMError {
    return new LLMError(
      LLMErrorCode.MODEL_NOT_FOUND,
      'unknown',
    );
  }

  static providerError(provider: string, details: any): LLMError {
    return new LLMError(
      LLMErrorCode.PROVIDER_NOT_FOUND,
      provider,
      details
    );
  }

  static networkError(details: any): LLMError {
    return new LLMError(
      LLMErrorCode.STREAM_ERROR,
      'unknown',
      details
    );
  }

  static timeout(timeoutMs: number): LLMError {
    return new LLMError(
      LLMErrorCode.STREAM_ERROR,
      'unknown',
      new Error(`Request timed out after ${timeoutMs}ms`)
    );
  }

  static invalidRequest(message: string): LLMError {
    return new LLMError(
      LLMErrorCode.API_ERROR,
      'unknown',
      new Error(message)
    );
  }

  /**
   * 获取错误详情
   */
  getDetails(): Record<string, any> {
    return {
      code: this.code,
      provider: this.provider,
      originalError: this.originalError,
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