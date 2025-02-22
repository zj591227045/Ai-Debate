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
  SESSION_RESTORE_FAILED = 'SESSION_RESTORE_FAILED',
  
  // 评分错误
  SCORING_FAILED = 'SCORING_FAILED',
  
  // 流错误
  STREAM_ERROR = 'STREAM_ERROR',
  
  // 未知错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  
  // 配置错误
  INVALID_CONFIG = 'INVALID_CONFIG',
  
  // 状态错误
  INVALID_STATE = 'INVALID_STATE',
  
  // 语音生成错误
  SPEECH_GENERATION_FAILED = 'SPEECH_GENERATION_FAILED',
  
  // 初始化错误
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  
  // 字符错误
  INVALID_CHARACTER = 'INVALID_CHARACTER'
}

export class DebateFlowException extends Error {
  constructor(
    public readonly code: DebateFlowError,
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
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