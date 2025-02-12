/**
 * 状态转换器接口
 */
export interface StateTransformer<T, U> {
  toUnified(state: Partial<T>): Partial<U>;
  fromUnified(state: U): T;
  deepMerge(target: any, source: any): any;
}

/**
 * 存储配置接口
 */
export interface StoreConfig {
  /** 存储命名空间 */
  namespace: string;
  /** 存储版本 */
  version: string;
  /** 持久化配置 */
  persistence?: {
    /** 是否启用持久化 */
    enabled: boolean;
    /** 存储键名 */
    key?: string;
    /** 存储类型 */
    storage?: 'local' | 'session' | 'memory';
  };
  /** 验证配置 */
  validation?: {
    /** 验证模式 */
    schema: unknown;
    /** 验证选项 */
    options?: ValidationOptions;
  };
}

/**
 * 验证选项接口
 */
export interface ValidationOptions {
  /** 是否严格模式 */
  strict?: boolean;
  /** 自定义验证器 */
  validators?: Record<string, (value: any) => boolean>;
}

/**
 * 状态容器接口
 */
export interface StateContainer<T> {
  /** 状态数据 */
  data: T;
  /** 元数据 */
  metadata: {
    /** 版本号 */
    version: string;
    /** 最后更新时间 */
    lastUpdated: number;
    /** 命名空间 */
    namespace: string;
  };
}

/**
 * 状态变更载荷接口
 */
export interface StateChangePayload<T = any> {
  /** 命名空间 */
  namespace: string;
  /** 新状态 */
  newState: T;
  /** 旧状态 */
  oldState: T;
  /** 变更时间戳 */
  timestamp: number;
}

/**
 * 存储错误接口
 */
export interface StoreError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: unknown;
  /** 命名空间 */
  namespace?: string;
}

/**
 * 存储事件枚举
 */
export enum StoreEvents {
  /** 状态变更事件 */
  STATE_CHANGED = 'state:state_changed',
  /** 持久化完成事件 */
  PERSIST_COMPLETED = 'state:persist_completed',
  /** 恢复完成事件 */
  HYDRATE_COMPLETED = 'state:hydrate_completed',
  /** 错误发生事件 */
  ERROR_OCCURRED = 'state:error_occurred',
  /** 初始化完成事件 */
  STORE_INITIALIZED = 'state:store_initialized'
} 