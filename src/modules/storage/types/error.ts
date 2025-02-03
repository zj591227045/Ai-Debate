export enum StorageErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ERROR = 'DUPLICATE_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  MIGRATION_ERROR = 'MIGRATION_ERROR',
}

export class StorageError extends Error {
  constructor(
    message: string,
    public code: StorageErrorCode,
    public field?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
} 