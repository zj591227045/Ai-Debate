import { z } from 'zod';
import { StorageManager } from '../StorageManager';

export abstract class BaseStorageService<T extends { id: string }> {
  protected abstract storageKey: string;
  protected abstract schema: z.ZodType<T>;
  protected storage = StorageManager.getInstance();

  // 获取所有记录
  async getAll(): Promise<T[]> {
    console.log(`[${this.storageKey}] 获取所有记录`);
    const data = await this.storage.get<T[]>(this.storageKey) || [];
    console.log(`[${this.storageKey}] 获取到的数据:`, data);
    const validData = data.filter(item => {
      const parseResult = this.schema.safeParse(item);
      if (!parseResult.success) {
        console.warn(`[${this.storageKey}] 数据验证失败:`, item, parseResult.error);
      }
      return parseResult.success;
    });
    console.log(`[${this.storageKey}] 有效数据:`, validData);
    return validData;
  }

  // 根据ID获取记录
  async getById(id: string): Promise<T | null> {
    console.log(`[${this.storageKey}] 获取记录, id:`, id);
    const items = await this.getAll();
    const item = items.find(item => item.id === id);
    console.log(`[${this.storageKey}] 获取到的记录:`, item);
    return item || null;
  }

  // 创建新记录
  async create(data: T): Promise<void> {
    console.log(`[${this.storageKey}] 创建新记录:`, data);
    const items = await this.getAll();
    const validationResult = this.schema.safeParse(data);
    if (!validationResult.success) {
      console.error(`[${this.storageKey}] 数据验证失败:`, validationResult.error);
      throw new Error('Invalid data format');
    }
    items.push(validationResult.data);
    await this.storage.set(this.storageKey, items);
    console.log(`[${this.storageKey}] 创建成功`);
  }

  // 更新记录
  async update(id: string, data: Partial<T>): Promise<void> {
    console.log(`[${this.storageKey}] 更新记录, id:`, id, '数据:', data);
    const items = await this.getAll();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) {
      console.error(`[${this.storageKey}] 记录不存在:`, id);
      throw new Error('Item not found');
    }
    const updatedItem = { ...items[index], ...data };
    const validationResult = this.schema.safeParse(updatedItem);
    if (!validationResult.success) {
      console.error(`[${this.storageKey}] 更新数据验证失败:`, validationResult.error);
      throw new Error('Invalid data format');
    }
    items[index] = validationResult.data;
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