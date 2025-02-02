import { StorageService } from '../types';
import { Validator } from './validator';

export function withValidation() {
  return function <T extends { new (...args: any[]): StorageService }>(Base: T) {
    return class extends Base {
      private validator = new Validator();

      constructor(...args: any[]) {
        super(...args);
      }

      async set<T extends { id: string }>(storeName: string, value: T): Promise<void> {
        // 验证数据
        await this.validator.validateData(storeName, value);
        // 调用原始方法
        return super.set(storeName, value);
      }

      async getAll<T>(storeName: string): Promise<T[]> {
        // 获取结果
        const results = await super.getAll(storeName) as T[];
        // 验证结果
        await this.validator.validateBulkData(storeName, results);
        return results;
      }

      async query<T>(
        storeName: string,
        indexName: string,
        query: IDBValidKey | IDBKeyRange,
        direction?: IDBCursorDirection
      ): Promise<T[]> {
        // 获取结果
        const results = await super.query(storeName, indexName, query, direction) as T[];
        // 验证结果
        await this.validator.validateBulkData(storeName, results);
        return results;
      }
    };
  };
} 