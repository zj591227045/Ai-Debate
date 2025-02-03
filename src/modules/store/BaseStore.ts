import { z } from 'zod';

export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface StoreState<T extends BaseEntity> {
  [key: string]: T;
}

export abstract class BaseStore<T extends BaseEntity> {
  protected abstract storageKey: string;
  protected abstract schema: z.ZodType<T>;
  protected abstract state: StoreState<T>;

  /**
   * 加载数据
   */
  async load(): Promise<void> {
    // 从 localStorage 加载数据
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        // 验证每个项目
        const state: StoreState<T> = {};
        for (const [key, value] of Object.entries(parsed)) {
          const validated = await this.schema.parseAsync(value);
          state[key] = validated;
        }
        this.setState(state);
      } catch (error) {
        console.error('加载数据失败:', error);
        // 如果数据无效，清除存储
        this.clear();
      }
    }
  }

  /**
   * 清除数据
   */
  async clear(): Promise<void> {
    localStorage.removeItem(this.storageKey);
    this.setState(this.getInitialState());
  }

  /**
   * 获取初始状态
   */
  protected getInitialState(): StoreState<T> {
    return {};
  }

  /**
   * 设置状态
   */
  protected abstract setState(state: StoreState<T>): void;

  /**
   * 获取当前状态
   */
  protected abstract getState(): StoreState<T>;

  /**
   * 保存状态
   */
  protected async save(): Promise<void> {
    const state = this.getState();
    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  /**
   * 根据ID获取项目
   */
  async getById(id: string): Promise<T | null> {
    const state = this.getState();
    return state[id] || null;
  }

  /**
   * 获取所有项目
   */
  async getAll(): Promise<T[]> {
    const state = this.getState();
    return Object.values(state);
  }
} 