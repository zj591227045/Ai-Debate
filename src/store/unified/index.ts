import { StateManager } from './StateManager';
import { StateAdapter } from './adapters';
import type { GameConfigState } from '../../types/config';
import type { CharacterStateStorage, UnifiedState } from './types';

export { StateManager, type UnifiedState };

export const getStateManager = (
  gameConfig?: GameConfigState,
  characterState?: CharacterStateStorage
): StateManager | null => {
  if (gameConfig && characterState) {
    // 转换为统一状态格式
    const unifiedState = StateAdapter.toUnified(gameConfig, characterState);
    console.log('创建统一状态:', unifiedState);
    
    // 使用单例模式获取或创建状态管理器
    const manager = StateManager.getInstance();
    manager.updateState(unifiedState);
    return manager;
  }
  
  // 如果已经存在实例，返回现有实例
  return StateManager.getInstance();
};

export const updateStateManager = (
  gameConfig: GameConfigState,
  characterState: CharacterStateStorage
): void => {
  const unifiedState = StateAdapter.toUnified(gameConfig, characterState);
  console.log('更新统一状态:', unifiedState);
  
  const manager = StateManager.getInstance();
  if (manager) {
    manager.updateState(unifiedState);
  }
};

export const clearStateManager = (): void => {
  StateManager.clearInstance();
}; 