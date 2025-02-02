// 存储配置接口
export interface StorageConfig {
  // 存储键定义
  storageKeys: {
    playerProfiles: string;
    debateHistory: string;
    userPreferences: string;
    currentDebate: string;
    modelConfig: string;
    characterConfig: string;
  };

  // 存储限制
  limits: {
    maxPlayerProfiles: number;
    maxDebateHistory: number;
    maxStorageSize: number; // 以字节为单位
  };

  // 版本控制
  version: {
    current: string;
    minimum: string;
  };
}

// 存储服务接口
export interface StorageService {
  get<T>(storeName: string, id: string): Promise<T | null>;
  getAll<T>(storeName: string): Promise<T[]>;
  set<T extends { id: string }>(storeName: string, value: T): Promise<void>;
  delete(storeName: string, id: string): Promise<void>;
  clear(storeName: string): Promise<void>;
  clearAll(): Promise<void>;
  query<T>(
    storeName: string,
    indexName: string,
    query: IDBValidKey | IDBKeyRange,
    direction?: IDBCursorDirection
  ): Promise<T[]>;
  count(storeName: string): Promise<number>;
}

// 本地存储数据结构
export interface LocalStorageData {
  version: string;
  timestamp: number;
  data: any;
}

// IndexedDB存储配置
export interface IndexedDBConfig {
  dbName: string;
  version: number;
  stores: {
    [key: string]: string; // store名称: 索引字段
  };
}

// 备份配置
export interface BackupConfig {
  autoBackup: {
    enabled: boolean;
    interval: number; // 毫秒
    maxBackups: number;
  };
  compression: boolean;
  encryption: boolean;
}

// 备份元数据
export interface BackupMeta {
  id: string;
  timestamp: number;
  version: string;
  size: number;
  checksum: string;
}

// 存储错误
export class StorageError extends Error {
  constructor(
    message: string,
    public code: StorageErrorCodes,
    public isRetryable: boolean
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

// 错误码定义
export enum StorageErrorCodes {
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CORRUPTION = 'CORRUPTION',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  BACKUP_FAILED = 'BACKUP_FAILED',
  RESTORE_FAILED = 'RESTORE_FAILED',
}

// 数据库表名称
export enum TableNames {
  Characters = 'characters',
  CharacterTemplates = 'character_templates',
  GameRules = 'game_rules',
  ScoringTemplates = 'scoring_templates',
  ModelConfigs = 'model_configs',
  ProviderConfigs = 'provider_configs',
  DebateHistory = 'debate_history'
}

// 排序方向
export type SortDirection = 'asc' | 'desc';

// 排序配置
export interface SortConfig {
  field: string;
  direction: SortDirection;
}

// 查询选项
export interface QueryOptions {
  sort?: SortConfig;
  limit?: number;
  offset?: number;
}

// 查询结果
export interface QueryResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
} 