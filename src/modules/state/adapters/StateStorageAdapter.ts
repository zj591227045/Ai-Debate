import { storage } from '../../storage';
import { DebateConfigService } from '../../storage/services/DebateConfigService';
import { TopicTemplateService } from '../../storage/services/TopicTemplateService';
import { RulesConfigService } from '../../storage/services/RulesConfigService';
import { CreateTemplateParams, TopicConfig, RulesConfig, SpeechRules } from '../../storage/types/debate';

type StorageService = DebateConfigService | TopicTemplateService | RulesConfigService;

/**
 * 状态存储适配器接口
 */
export interface IStateStorageAdapter {
  /**
   * 保存状态
   * @param namespace 命名空间
   * @param state 状态数据
   */
  saveState<T extends Record<string, any>>(namespace: string, state: T): Promise<void>;

  /**
   * 加载状态
   * @param namespace 命名空间
   */
  loadState<T extends Record<string, any>>(namespace: string): Promise<T | null>;

  /**
   * 删除状态
   * @param namespace 命名空间
   */
  removeState(namespace: string): Promise<void>;

  /**
   * 清除所有状态
   */
  clearAll(): Promise<void>;
}

/**
 * 内存存储适配器
 */
export class MemoryStorageAdapter implements IStateStorageAdapter {
  private storage = new Map<string, string>();

  async saveState<T extends Record<string, any>>(namespace: string, state: T): Promise<void> {
    this.storage.set(namespace, JSON.stringify(state));
  }

  async loadState<T extends Record<string, any>>(namespace: string): Promise<T | null> {
    const data = this.storage.get(namespace);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async removeState(namespace: string): Promise<void> {
    this.storage.delete(namespace);
  }

  async clearAll(): Promise<void> {
    this.storage.clear();
  }
}

/**
 * 持久化存储适配器
 */
export class PersistentStorageAdapter implements IStateStorageAdapter {
  private storagePromise: Promise<typeof storage>;

  constructor() {
    this.storagePromise = import('../../storage').then(module => module.storage);
  }

  async saveState<T extends Record<string, any>>(namespace: string, state: T): Promise<void> {
    try {
      const stateString = JSON.stringify(state);
      localStorage.setItem(`state_${namespace}`, stateString);
    } catch (error) {
      console.error('Failed to save state:', error);
      throw error;
    }
  }

  async loadState<T extends Record<string, any>>(namespace: string): Promise<T | null> {
    try {
      const stateString = localStorage.getItem(`state_${namespace}`);
      if (!stateString) return null;
      return JSON.parse(stateString) as T;
    } catch (error) {
      console.error('Failed to load state:', error);
      return null;
    }
  }

  async removeState(namespace: string): Promise<void> {
    try {
      localStorage.removeItem(`state_${namespace}`);
    } catch (error) {
      console.error('Failed to remove state:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('state_')) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Failed to clear all states:', error);
      throw error;
    }
  }
} 