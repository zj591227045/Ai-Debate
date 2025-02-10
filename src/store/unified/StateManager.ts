import type { 
  UnifiedState, 
  UnifiedAction, 
  UnifiedSubscriber,
  UnifiedDispatch,
  StorageState,
  CharacterStateStorage,
  StateMeta,
  TopicConfig,
  RuleConfig
} from './types';
import { StateAdapter } from './adapters';
import type { CharacterConfig } from '../../modules/character/types';
import type { GameConfigState } from '../../types/config';

export class StateManager {
  private static instance: StateManager;
  private state: UnifiedState;
  private subscribers: UnifiedSubscriber[];

  private constructor() {
    this.state = StateAdapter.createInitialState();
    this.subscribers = [];
  }

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  public static clearInstance(): void {
    StateManager.instance = new StateManager();
  }

  public updateState(newState: UnifiedState): void {
    this.state = newState;
    this.notifySubscribers();
  }

  public getState(): UnifiedState {
    return this.state;
  }

  public dispatch: UnifiedDispatch = (action) => {
    switch (action.type) {
      case 'CHARACTER_SELECTED':
        // Handle character selection
        break;
      case 'CHARACTER_UPDATED':
        if (action.payload.id && action.payload.changes) {
          this.state.characters.byId[action.payload.id] = {
            ...this.state.characters.byId[action.payload.id],
            ...action.payload.changes
          };
        }
        break;
      case 'CHARACTER_ADDED':
        if (action.payload.id) {
          this.state.characters.byId[action.payload.id] = action.payload;
        }
        break;
      case 'CHARACTER_DELETED':
        if (action.payload.id) {
          delete this.state.characters.byId[action.payload.id];
        }
        break;
      // Add other action handlers as needed
    }
    
    // Notify subscribers
    this.notifySubscribers();
  };

  public subscribe(callback: UnifiedSubscriber): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.state));
  }

  // 获取原始状态格式
  getOriginalState() {
    return StateAdapter.fromUnified(this.state);
  }

  // 保存状态到本地存储
  public saveState(): boolean {
    try {
      const storageState: StorageState = {
        ...this.state,
        meta: {
          version: '1.0.0',
          timestamp: Date.now(),
          lastModified: this.state.characters.meta.lastModified
        }
      };
      localStorage.setItem('unifiedState', JSON.stringify(storageState));
      console.log('状态已保存到本地存储');
      return true;
    } catch (error) {
      console.error('保存状态失败:', error);
      return false;
    }
  }

  // 从本地存储加载状态
  public loadState(): UnifiedState | null {
    try {
      const saved = localStorage.getItem('unifiedState');
      if (saved) {
        const parsed = JSON.parse(saved) as StorageState;
        if (parsed.meta?.version === '1.0.0') {
          if (parsed.characters && Object.keys(parsed.characters.byId).length > 0) {
            this.state = {
              ...parsed,
              characters: {
                ...parsed.characters,
                meta: {
                  ...parsed.characters.meta,
                  lastModified: Date.now()
                }
              }
            };
          } else {
            const savedCharacterState = localStorage.getItem('characterState');
            if (savedCharacterState) {
              const characterState = JSON.parse(savedCharacterState) as CharacterStateStorage;
              if (Array.isArray(characterState.characters) && characterState.characters.length > 0) {
                const byId = characterState.characters.reduce<Record<string, CharacterConfig>>((acc, char) => {
                  acc[char.id] = char;
                  return acc;
                }, {});

                this.state = {
                  ...this.state,
                  characters: {
                    ...this.state.characters,
                    byId,
                    activeCharacters: Object.keys(byId),
                    meta: {
                      lastModified: Date.now(),
                      version: '1.0.0'
                    }
                  }
                };
              }
            }
          }
          this.notifySubscribers();
          console.log('已从本地存储加载状态，角色数量:', Object.keys(this.state.characters.byId).length);
          return this.state;
        }
      }
    } catch (error) {
      console.error('加载状态失败:', error);
    }
    return null;
  }

  // 重置状态
  reset = () => {
    localStorage.removeItem('unifiedState');
    this.state = StateAdapter.createInitialState();
    this.notifySubscribers();
  };

  // 获取状态元数据
  getMeta = (): StateMeta => {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      lastModified: this.state.characters.meta.lastModified
    };
  };

  // 导出状态
  exportState = (): StorageState => {
    return {
      ...this.state,
      meta: this.getMeta()
    };
  };

  // 导入状态
  importState = (state: StorageState): boolean => {
    try {
      if (state.meta?.version === '1.0.0') {
        this.state = {
          ...state,
          characters: {
            ...state.characters,
            meta: {
              ...state.characters.meta,
              lastModified: Date.now()
            }
          }
        };
        this.saveState();
        this.notifySubscribers();
        return true;
      }
    } catch (error) {
      console.error('导入状态失败:', error);
    }
    return false;
  };

  // 获取玩家的角色信息
  getPlayerCharacter = (playerId: string) => {
    return StateAdapter.getPlayerCharacter(this.state, playerId);
  };

  // 获取所有AI玩家及其角色信息
  getAIPlayersWithCharacters = () => {
    return StateAdapter.getAIPlayersWithCharacters(this.state);
  };
} 