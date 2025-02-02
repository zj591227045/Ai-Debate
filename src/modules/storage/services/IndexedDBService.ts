import { StorageService, StorageError, StorageErrorCodes, TableNames } from '../types';
import type { IndexedDBConfig } from '../types';
import { DATABASE_CONFIG, COMPOUND_INDEXES } from '../config/database.config';
import { withValidation } from '../validation/storage.decorator';
import { Validator } from '../validation/validator';

@withValidation()
export class IndexedDBService implements StorageService {
  private db: IDBDatabase | null = null;
  protected config: IndexedDBConfig;

  constructor(config: IndexedDBConfig = DATABASE_CONFIG) {
    this.config = config;
  }

  private async initDB(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        reject(new StorageError(
          'IndexedDB 初始化失败',
          StorageErrorCodes.CORRUPTION,
          false
        ));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建存储对象
        Object.entries(this.config.stores).forEach(([storeName, indexFields]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            
            // 创建单字段索引
            indexFields.split(',').forEach(field => {
              const trimmedField = field.trim();
              if (trimmedField && trimmedField !== 'id') {
                store.createIndex(trimmedField, trimmedField);
              }
            });

            // 创建复合索引
            const compoundIndexes = COMPOUND_INDEXES[storeName as keyof typeof COMPOUND_INDEXES];
            if (compoundIndexes) {
              compoundIndexes.forEach(([...fields], index) => {
                const indexName = fields.join('_');
                store.createIndex(indexName, fields);
              });
            }
          }
        });
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) {
      throw new StorageError(
        'IndexedDB 未初始化',
        StorageErrorCodes.CORRUPTION,
        true
      );
    }

    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async get<T>(storeName: string, id: string): Promise<T | null> {
    await this.initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result as T);
        };

        request.onerror = () => {
          reject(new StorageError(
            '读取数据失败',
            StorageErrorCodes.CORRUPTION,
            false
          ));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    await this.initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result as T[]);
        };

        request.onerror = () => {
          reject(new StorageError(
            '读取数据失败',
            StorageErrorCodes.CORRUPTION,
            false
          ));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async set<T extends { id: string }>(storeName: string, value: T): Promise<void> {
    await this.initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName, 'readwrite');
        const request = store.put(value);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new StorageError(
            '保存数据失败',
            StorageErrorCodes.CORRUPTION,
            false
          ));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    await this.initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName, 'readwrite');
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new StorageError(
            '删除数据失败',
            StorageErrorCodes.CORRUPTION,
            false
          ));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async clear(storeName: string): Promise<void> {
    await this.initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName, 'readwrite');
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(new StorageError(
            '清除数据失败',
            StorageErrorCodes.CORRUPTION,
            false
          ));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async clearAll(): Promise<void> {
    await this.initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const storeNames = Array.from(this.db!.objectStoreNames);
        const transaction = this.db!.transaction(storeNames, 'readwrite');

        let completed = 0;
        let hasError = false;

        storeNames.forEach(storeName => {
          const store = transaction.objectStore(storeName);
          const request = store.clear();

          request.onsuccess = () => {
            completed++;
            if (completed === storeNames.length && !hasError) {
              resolve();
            }
          };

          request.onerror = () => {
            if (!hasError) {
              hasError = true;
              reject(new StorageError(
                '清除数据失败',
                StorageErrorCodes.CORRUPTION,
                false
              ));
            }
          };
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async query<T>(
    storeName: string,
    indexName: string,
    query: IDBValidKey | IDBKeyRange,
    direction: IDBCursorDirection = 'next'
  ): Promise<T[]> {
    await this.initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName);
        const index = store.index(indexName);
        const request = index.openCursor(query, direction);

        const results: T[] = [];

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };

        request.onerror = () => {
          reject(new StorageError(
            '查询数据失败',
            StorageErrorCodes.CORRUPTION,
            false
          ));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  async count(storeName: string): Promise<number> {
    await this.initDB();
    
    return new Promise((resolve, reject) => {
      try {
        const store = this.getStore(storeName);
        const request = store.count();

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(new StorageError(
            '计数失败',
            StorageErrorCodes.CORRUPTION,
            false
          ));
        };
      } catch (error) {
        reject(error);
      }
    });
  }
}