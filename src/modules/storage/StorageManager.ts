export class StorageManager {
  private static instance: StorageManager;
  private storage: Storage;

  private constructor() {
    this.storage = window.localStorage;
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // 获取数据
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = this.storage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting data from storage:', error);
      return null;
    }
  }

  // 设置数据
  async set<T>(key: string, value: T): Promise<void> {
    try {
      const data = JSON.stringify(value);
      this.storage.setItem(key, data);
    } catch (error) {
      console.error('Error setting data to storage:', error);
      throw error;
    }
  }

  // 删除数据
  async remove(key: string): Promise<void> {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error('Error removing data from storage:', error);
      throw error;
    }
  }

  // 清空所有数据
  async clear(): Promise<void> {
    try {
      this.storage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // 获取所有键
  async keys(): Promise<string[]> {
    return Object.keys(this.storage);
  }

  // 检查键是否存在
  async has(key: string): Promise<boolean> {
    return this.storage.getItem(key) !== null;
  }
} 