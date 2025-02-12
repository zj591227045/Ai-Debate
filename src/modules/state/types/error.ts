/**
 * 存储错误代码枚举
 */
export enum StoreErrorCode {
  /** 初始化失败 */
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  /** 验证失败 */
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  /** 持久化失败 */
  PERSISTENCE_FAILED = 'PERSISTENCE_FAILED',
  /** 状态恢复失败 */
  HYDRATION_FAILED = 'HYDRATION_FAILED',
  /** 状态更新失败 */
  UPDATE_FAILED = 'UPDATE_FAILED',
  /** 配置无效 */
  INVALID_CONFIG = 'INVALID_CONFIG',
  /** 命名空间冲突 */
  NAMESPACE_CONFLICT = 'NAMESPACE_CONFLICT',
  /** 重置失败 */
  RESET_FAILED = 'RESET_FAILED',
  /** 未知错误 */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  /** 状态迁移失败 */
  MIGRATION_FAILED = 'MIGRATION_FAILED',
  /** 调试日志失败 */
  DEBUG_LOG_FAILED = 'DEBUG_LOG_FAILED',
  /** 存储未找到 */
  STORE_NOT_FOUND = 'STORE_NOT_FOUND'
}

/**
 * 存储错误类
 */
export class StoreError extends Error {
  /** 错误代码 */
  public readonly code: StoreErrorCode;
  /** 错误详情 */
  public readonly details?: unknown;
  /** 命名空间 */
  public readonly namespace?: string;

  constructor(
    code: StoreErrorCode,
    message: string,
    details?: unknown,
    namespace?: string
  ) {
    super(message);
    this.name = 'StoreError';
    this.code = code;
    this.details = details;
    this.namespace = namespace;

    // 确保原型链正确
    Object.setPrototypeOf(this, StoreError.prototype);
  }

  /**
   * 创建验证错误
   */
  static validation(message: string, details?: unknown, namespace?: string): StoreError {
    return new StoreError(
      StoreErrorCode.VALIDATION_FAILED,
      message,
      details,
      namespace
    );
  }

  /**
   * 创建持久化错误
   */
  static persistence(message: string, details?: unknown, namespace?: string): StoreError {
    return new StoreError(
      StoreErrorCode.PERSISTENCE_FAILED,
      message,
      details,
      namespace
    );
  }

  /**
   * 创建状态恢复错误
   */
  static hydration(message: string, details?: unknown, namespace?: string): StoreError {
    return new StoreError(
      StoreErrorCode.HYDRATION_FAILED,
      message,
      details,
      namespace
    );
  }

  /**
   * 创建状态更新错误
   */
  static update(message: string, details?: unknown, namespace?: string): StoreError {
    return new StoreError(
      StoreErrorCode.UPDATE_FAILED,
      message,
      details,
      namespace
    );
  }

  /**
   * 创建配置错误
   */
  static config(message: string, details?: unknown, namespace?: string): StoreError {
    return new StoreError(
      StoreErrorCode.INVALID_CONFIG,
      message,
      details,
      namespace
    );
  }

  /**
   * 创建迁移错误
   */
  static migration(message: string, details?: unknown, namespace?: string): StoreError {
    return new StoreError(
      StoreErrorCode.MIGRATION_FAILED,
      message,
      details,
      namespace
    );
  }

  /**
   * 创建调试日志错误
   */
  static debugLog(message: string, details?: unknown, namespace?: string): StoreError {
    return new StoreError(
      StoreErrorCode.DEBUG_LOG_FAILED,
      message,
      details,
      namespace
    );
  }

  /**
   * 获取错误的调试信息
   */
  getDebugInfo(): string {
    return JSON.stringify({
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      namespace: this.namespace,
      stack: this.stack
    }, null, 2);
  }
} 