export enum DebateFlowError {
  // 发言顺序错误
  INVALID_SPEAKING_ORDER = 'INVALID_SPEAKING_ORDER',
  SPEAKER_NOT_FOUND = 'SPEAKER_NOT_FOUND',
  DUPLICATE_SPEAKER = 'DUPLICATE_SPEAKER',
  
  // 轮次控制错误
  INVALID_ROUND_TRANSITION = 'INVALID_ROUND_TRANSITION',
  ROUND_NOT_FOUND = 'ROUND_NOT_FOUND',
  ROUND_ALREADY_COMPLETED = 'ROUND_ALREADY_COMPLETED',
  
  // AI生成错误
  AI_GENERATION_TIMEOUT = 'AI_GENERATION_TIMEOUT',
  AI_GENERATION_FAILED = 'AI_GENERATION_FAILED',
  AI_RESPONSE_INVALID = 'AI_RESPONSE_INVALID',
  
  // 会话错误
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_SAVE_FAILED = 'SESSION_SAVE_FAILED',
  SESSION_RESTORE_FAILED = 'SESSION_RESTORE_FAILED'
}

export class DebateFlowException extends Error {
  constructor(
    public readonly code: DebateFlowError,
    public readonly details?: any
  ) {
    super(`DebateFlow Error: ${code}`);
    this.name = 'DebateFlowException';
  }
}

export interface ErrorRecoveryStrategy {
  // 重试配置
  retryConfig: {
    maxAttempts: number;
    backoffFactor: number;
    initialDelay: number;
  };
  
  // 错误处理映射
  errorHandlers: {
    [key in DebateFlowError]: (error: Error) => Promise<void>;
  };
} 