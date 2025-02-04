import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { StorageManager } from '../StorageManager';
import { BaseEntity } from '../validation/schemas/base.schema';
import { StorageError, StorageErrorCode } from '../types/error';

export abstract class BaseStorageService<T extends BaseEntity> {
  protected abstract storageKey: string;
  protected abstract schema: z.ZodType<T>;
  protected storage = StorageManager.getInstance();

  protected generateId(): string {
    return uuidv4();
  }

  protected async validate(data: T): Promise<void> {
    try {
      await this.schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new StorageError(
          error.errors[0].message,
          StorageErrorCode.VALIDATION_ERROR,
          error.errors[0].path.join('.')
        );
      }
      throw error;
    }
  }

  // 获取所有记录
  async getAll(): Promise<T[]> {
    //console.log(`[${this.storageKey}] 获取所有记录`);
    const data = await this.storage.get<T[]>(this.storageKey) || [];
    // console.log(`[${this.storageKey}] 获取到的数据:`, data);
    const validData = data.filter(item => {
      const parseResult = this.schema.safeParse(item);
      if (!parseResult.success) {
        console.warn(`[${this.storageKey}] 数据验证失败:`, item, parseResult.error);
      }
      return parseResult.success;
    });
    //console.log(`[${this.storageKey}] 有效数据:`, validData);
    return validData;
  }

  // 根据ID获取记录
  async getById(id: string): Promise<T | null> {
    //console.log(`[${this.storageKey}] 获取记录, id:`, id);
    const items = await this.getAll();
    const item = items.find(item => item.id === id);
    // console.log(`[${this.storageKey}] 获取到的记录:`, item);
    return item || null;
  }

  // 创建新记录
  async create(data: T): Promise<void> {
    await this.validate(data);
    console.log(`[${this.storageKey}] 创建新记录:`, data);
    const items = await this.getAll();
    items.push(data);
    await this.storage.set(this.storageKey, items);
    console.log(`[${this.storageKey}] 创建成功`);
  }

  // 更新记录
  async update(id: string, data: Partial<T>): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new StorageError(
        '记录不存在',
        StorageErrorCode.NOT_FOUND_ERROR
      );
    }
    await this.validate({ ...existing, ...data });
    console.log(`[${this.storageKey}] 更新记录, id:`, id, '数据:', data);
    const items = await this.getAll();
    const index = items.findIndex(item => item.id === id);
    const updatedItem = { ...items[index], ...data };
    items[index] = updatedItem;
    await this.storage.set(this.storageKey, items);
    console.log(`[${this.storageKey}] 更新成功`);
  }

  // 删除记录
  async delete(id: string): Promise<void> {
    console.log(`[${this.storageKey}] 删除记录, id:`, id);
    const items = await this.getAll();
    const filteredItems = items.filter(item => item.id !== id);
    await this.storage.set(this.storageKey, filteredItems);
    console.log(`[${this.storageKey}] 删除成功`);
  }

  // 保存所有记录
  protected async saveAll(items: T[]): Promise<void> {
    console.log(`[${this.storageKey}] 保存所有记录:`, items);
    const validItems = items.filter(item => {
      const parseResult = this.schema.safeParse(item);
      if (!parseResult.success) {
        console.warn(`[${this.storageKey}] 数据验证失败:`, item, parseResult.error);
      }
      return parseResult.success;
    });
    await this.storage.set(this.storageKey, validItems);
    console.log(`[${this.storageKey}] 保存成功`);
  }

  // 清空所有记录
  async clear(): Promise<void> {
    console.log(`[${this.storageKey}] 清空所有记录`);
    await this.storage.remove(this.storageKey);
    console.log(`[${this.storageKey}] 清空成功`);
  }
} 