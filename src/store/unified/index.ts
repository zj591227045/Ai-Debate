import { StateManager } from './StateManager';
import { StateAdapter } from './adapters';
import type { GameConfigState } from '../../types/config';
import type { CharacterState } from '../../modules/character/context/CharacterContext';
import type { UnifiedState } from './types';

export * from './types';
export * from './adapters';
export * from './StateManager';

export const getStateManager = (
  gameConfig?: GameConfigState,
  characterState?: CharacterState
): StateManager | null => {
  if (gameConfig && characterState) {
    // 转换为统一状态格式
    const unifiedState = StateAdapter.toUnified(gameConfig, characterState);
    console.log('转换后的统一状态:', unifiedState);
    
    // 使用单例模式获取或创建状态管理器
    return StateManager.getInstance(unifiedState);
  }
  
  // 如果已经存在实例，返回现有实例
  return StateManager.getInstance();
};

export const updateStateManager = (
  gameConfig: GameConfigState,
  characterState: CharacterState
): void => {
  const unifiedState = StateAdapter.toUnified(gameConfig, characterState);
  console.log('更新统一状态:', unifiedState);
  
  const manager = StateManager.getInstance(unifiedState);
  if (manager) {
    manager.updateState(unifiedState);
  }
};

export const clearStateManager = (): void => {
  StateManager.clearInstance();
}; 