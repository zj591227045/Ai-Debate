export * from './hooks';

import { StoreManager } from '../core/StoreManager';
import { GameConfigStore, ModelStore, GameRulesStore } from '../stores';
import { UnifiedState } from '../types';

/**
 * 初始化状态管理
 */
export async function initializeState() {
  try {
    console.log('开始初始化状态管理...');
    const manager = StoreManager.getInstance();

    // 如果已经初始化完成，直接返回
    if (manager.isStoreInitialized()) {
      console.log('状态管理已经初始化，跳过初始化过程');
      return;
    }

    // 注册存储实例
    console.log('注册 GameConfigStore...');
    manager.registerStore(
      new GameConfigStore({
        namespace: 'gameConfig',
        version: '1.0.0',
        persistence: {
          enabled: true,
          storage: 'local',
          autoHydrate: true
        }
      })
    );

    console.log('注册 ModelStore...');
    manager.registerStore(
      new ModelStore({
        namespace: 'model',
        version: '1.0.0',
        persistence: {
          enabled: true,
          storage: 'local'
        }
      })
    );

    console.log('注册 GameRulesStore...');
    manager.registerStore(
      new GameRulesStore({
        namespace: 'gameRules',
        version: '1.0.0',
        persistence: {
          enabled: true,
          storage: 'local'
        }
      })
    );

    // 恢复状态
    console.log('恢复所有状态...');
    await manager.hydrateAll();
    console.log('状态管理初始化完成');
  } catch (error) {
    // 如果是重复注册且版本相同的错误，可以继续执行
    if (error instanceof Error && error.message.includes('already exists with same version')) {
      console.log('状态管理已存在且版本相同，继续执行');
      return;
    }
    console.error('状态管理初始化失败:', error);
    throw error;
  }
}

/**
 * 获取统一状态
 */
export function getUnifiedState(): UnifiedState {
  return StoreManager.getInstance().getUnifiedState();
}

/**
 * 更新统一状态
 * @param update 状态更新
 */
export function updateUnifiedState(update: Partial<UnifiedState>): void {
  StoreManager.getInstance().updateUnifiedState(update);
}

/**
 * 持久化所有状态
 */
export function persistAllState(): Promise<void> {
  return StoreManager.getInstance().persistAll();
}

/**
 * 恢复所有状态
 */
export function hydrateAllState(): Promise<void> {
  return StoreManager.getInstance().hydrateAll();
}

/**
 * 重置所有状态
 */
export function resetAllState(): void {
  StoreManager.getInstance().resetAll();
} 