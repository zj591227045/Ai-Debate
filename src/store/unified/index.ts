export * from './types';
export * from './adapters';
export * from './StateManager';

// 创建单例实例
import { StateManager } from './StateManager';
import { StateAdapter } from './adapters';
import type { GameConfigState } from '../../types/config';
import type { CharacterState } from '../../modules/character/context/CharacterContext';

let stateManagerInstance: StateManager | null = null;

export const getStateManager = (
  gameConfig?: GameConfigState,
  characterState?: CharacterState
) => {
  if (!stateManagerInstance && gameConfig && characterState) {
    const initialState = StateAdapter.toUnified(gameConfig, characterState);
    stateManagerInstance = new StateManager(initialState);
  }
  return stateManagerInstance;
};

export const clearStateManager = () => {
  stateManagerInstance = null;
}; 