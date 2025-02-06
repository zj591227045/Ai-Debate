import type { 
  UnifiedState, 
  UnifiedAction, 
  Subscriber, 
  Unsubscribe,
  StorageState,
  CharacterStateStorage,
  StateMeta
} from './types';
import { StateAdapter } from './adapters';
import type { CharacterConfig } from '../../modules/character/types';

export class StateManager {
  private state: UnifiedState;
  private subscribers: Array<(state: UnifiedState) => void> = [];
  private static instance: StateManager | null = null;

  constructor(initialState: UnifiedState) {
    this.state = initialState;
    console.log('StateManager 初始化状态:', initialState);
  }

  public static getInstance(initialState?: UnifiedState): StateManager {
    if (!StateManager.instance && initialState) {
      StateManager.instance = new StateManager(initialState);
    } else if (initialState) {
      // 如果已经存在实例但传入了新的初始状态，则更新状态
      StateManager.instance?.updateState(initialState);
    }
    return StateManager.instance as StateManager;
  }

  public static clearInstance(): void {
    StateManager.instance = null;
  }

  // 更新整个状态树
  public updateState(newState: UnifiedState): void {
    console.log('StateManager 更新状态:', newState);
    this.state = newState;
    this.notifySubscribers();
  }

  // 获取当前状态
  public getState(): UnifiedState {
    return this.state;
  }

  // 获取原始状态格式
  getOriginalState() {
    return StateAdapter.fromUnified(this.state);
  }

  // 订阅状态变化
  public subscribe(callback: (state: UnifiedState) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // 通知所有订阅者
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.state));
  }

  // 分发动作
  public dispatch(action: any): void {
    console.log('StateManager 分发动作:', action);
    switch (action.type) {
      case 'DEBATE_STATE_UPDATED':
        this.state = {
          ...this.state,
          debate: {
            ...this.state.debate,
            currentState: {
              ...this.state.debate.currentState,
              ...action.payload
            }
          }
        };
        break;
        
      case 'JUDGE_CONFIG_UPDATED':
        this.state = {
          ...this.state,
          debate: {
            ...this.state.debate,
            judge: {
              ...this.state.debate.judge,
              ...action.payload.judge
            },
            judging: {
              ...this.state.debate.judging,
              ...action.payload.judging
            }
          }
        };
        break;

      case 'JUDGE_SELECTED':
        this.state = {
          ...this.state,
          debate: {
            ...this.state.debate,
            judge: {
              ...this.state.debate.judge,
              characterId: action.payload.characterId,
              name: action.payload.name,
              avatar: action.payload.avatar
            }
          }
        };
        break;

      case 'JUDGING_DIMENSIONS_UPDATED':
        this.state = {
          ...this.state,
          debate: {
            ...this.state.debate,
            judging: {
              ...this.state.debate.judging,
              dimensions: action.payload.dimensions,
              totalScore: action.payload.totalScore
            }
          }
        };
        break;
    }
    this.notifySubscribers();
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
          // 确保角色信息不为空
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
            // 如果角色信息为空，尝试从 characterState 加载
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
                    allIds: Object.keys(byId),
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