import { StorageService, StorageError, StorageErrorCodes, LocalStorageData } from '../types';
import { storageConfig } from '../config/storage.config';

export class LocalStorageService implements StorageService {
  private validateStorageQuota(dataSize: number): void {
    const totalSize = this.calculateTotalSize();
    if (totalSize + dataSize > storageConfig.limits.maxStorageSize) {
      throw new StorageError(
        '存储空间不足',
        StorageErrorCodes.QUOTA_EXCEEDED,
        false
      );
    }
  }

  private calculateTotalSize(): number {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        total += localStorage.getItem(key)?.length || 0;
      }
    }
    return total;
  }

  private createStorageData<T>(data: T): LocalStorageData {
    return {
      version: storageConfig.version.current,
      timestamp: Date.now(),
      data
    };
  }

  async get<T>(storeName: string, id: string): Promise<T | null> {
    try {
      const key = `${storeName}:${id}`;
      const item = localStorage.getItem(key);
      if (!item) return null;

      const storageData = JSON.parse(item) as LocalStorageData;
      if (storageData.version < storageConfig.version.minimum) {
        throw new StorageError(
          '数据版本不兼容',
          StorageErrorCodes.VERSION_MISMATCH,
          false
        );
      }

      return storageData.data as T;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        '读取数据失败',
        StorageErrorCodes.CORRUPTION,
        false
      );
    }
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const results: T[] = [];
      const prefix = `${storeName}:`;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const item = await this.get<T>(storeName, key.slice(prefix.length));
          if (item) {
            results.push(item);
          }
        }
      }
      
      return results;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        '读取数据失败',
        StorageErrorCodes.CORRUPTION,
        false
      );
    }
  }

  async set<T extends { id: string }>(storeName: string, value: T): Promise<void> {
    try {
      const key = `${storeName}:${value.id}`;
      const storageData = this.createStorageData(value);
      const dataString = JSON.stringify(storageData);
      
      this.validateStorageQuota(dataString.length);
      localStorage.setItem(key, dataString);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(
        '保存数据失败',
        StorageErrorCodes.CORRUPTION,
        false
      );
    }
  }

  async delete(storeName: string, id: string): Promise<void> {
    try {
      const key = `${storeName}:${id}`;
      localStorage.removeItem(key);
    } catch (error) {
      throw new StorageError(
        '删除数据失败',
        StorageErrorCodes.CORRUPTION,
        false
      );
    }
  }

  async clear(storeName: string): Promise<void> {
    try {
      const prefix = `${storeName}:`;
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      throw new StorageError(
        '清除数据失败',
        StorageErrorCodes.CORRUPTION,
        false
      );
    }
  }

  async clearAll(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      throw new StorageError(
        '清除所有数据失败',
        StorageErrorCodes.CORRUPTION,
        false
      );
    }
  }

  async query<T>(
    storeName: string,
    indexName: string,
    query: IDBValidKey | IDBKeyRange,
    direction: IDBCursorDirection = 'next'
  ): Promise<T[]> {
    // LocalStorage不支持索引查询，返回所有匹配storeName的数据
    return this.getAll<T>(storeName);
  }

  async count(storeName: string): Promise<number> {
    try {
      const prefix = `${storeName}:`;
      let count = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          count++;
        }
      }
      
      return count;
    } catch (error) {
      throw new StorageError(
        '计数失败',
        StorageErrorCodes.CORRUPTION,
        false
      );
    }
  }
} 