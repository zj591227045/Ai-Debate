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
  private subscribers = new Set<Subscriber>();
  private version = '1.0.0';

  constructor(initialState: UnifiedState) {
    console.log('========== StateManager 初始化 ==========');
    this.state = initialState;
    this.loadFromStorage(); // 尝试从存储加载状态
  }

  // 获取当前状态
  getState(): UnifiedState {
    return this.state;
  }

  // 获取原始状态格式
  getOriginalState() {
    return StateAdapter.fromUnified(this.state);
  }

  // 更新状态
  dispatch = (action: UnifiedAction) => {
    console.log('========== StateManager.dispatch 开始 ==========');
    console.log('Action:', {
      type: action.type,
      payload: action.payload
    });

    const oldState = { ...this.state };
    let stateChanged = false;

    switch (action.type) {
      case 'CHARACTER_UPDATED': {
        const { id, changes } = action.payload;
        if (this.state.characters.byId[id]) {
          this.state = {
            ...this.state,
            characters: {
              ...this.state.characters,
              byId: {
                ...this.state.characters.byId,
                [id]: {
                  ...this.state.characters.byId[id],
                  ...changes
                }
              },
              meta: {
                ...this.state.characters.meta,
                lastModified: Date.now()
              }
            }
          };
          stateChanged = true;
        }
        break;
      }
      
      case 'PLAYER_UPDATED': {
        const { id, changes } = action.payload;
        if (this.state.debate.players.byId[id]) {
          this.state = {
            ...this.state,
            debate: {
              ...this.state.debate,
              players: {
                ...this.state.debate.players,
                byId: {
                  ...this.state.debate.players.byId,
                  [id]: {
                    ...this.state.debate.players.byId[id],
                    ...changes
                  }
                }
              }
            }
          };
          stateChanged = true;
        }
        break;
      }
      
      case 'DEBATE_STATE_UPDATED': {
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
        stateChanged = true;
        break;
      }
      
      case 'CONFIG_UPDATED': {
        this.state = {
          ...this.state,
          config: {
            ...this.state.config,
            ...action.payload
          }
        };
        stateChanged = true;
        break;
      }
      
      case 'BATCH_UPDATE': {
        this.state = {
          ...this.state,
          ...action.payload,
          characters: {
            ...this.state.characters,
            meta: {
              ...this.state.characters.meta,
              lastModified: Date.now()
            }
          }
        };
        stateChanged = true;
        break;
      }
    }

    if (stateChanged) {
      console.log('状态更新后:', {
        charactersCount: Object.keys(this.state.characters.byId).length,
        playersCount: Object.keys(this.state.debate.players.byId).length,
        currentRound: this.state.debate.currentState.round,
        lastModified: this.state.characters.meta.lastModified
      });

      this.saveToStorage(); // 自动保存状态
      this.notifySubscribers();
    }

    console.log('========== StateManager.dispatch 完成 ==========');
  };

  // 订阅状态更新
  subscribe = (subscriber: Subscriber): Unsubscribe => {
    this.subscribers.add(subscriber);
    
    // 立即通知新订阅者当前状态
    subscriber(this.state);
    
    return () => {
      this.subscribers.delete(subscriber);
    };
  };

  // 通知所有订阅者
  private notifySubscribers = () => {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(this.state);
      } catch (error) {
        console.error('通知订阅者失败:', error);
      }
    });
  };

  // 重置状态
  reset = () => {
    localStorage.removeItem('unifiedState');
    this.state = StateAdapter.createInitialState();
    this.notifySubscribers();
  };

  // 获取状态元数据
  getMeta = (): StateMeta => {
    return {
      version: this.version,
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
      if (state.meta?.version === this.version) {
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
        this.saveToStorage();
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

  // 公共存储接口
  saveState = () => {
    return this.saveToStorage();
  };

  // 公共加载接口
  loadState = () => {
    return this.loadFromStorage();
  };

  // 私有存储实现
  private saveToStorage = () => {
    try {
      const storageState: StorageState = {
        ...this.state,
        meta: {
          version: this.version,
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
  };

  // 私有加载实现
  private loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('unifiedState');
      if (saved) {
        const parsed = JSON.parse(saved) as StorageState;
        if (parsed.meta?.version === this.version) {
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
                      version: this.version
                    }
                  }
                };
              }
            }
          }
          this.notifySubscribers();
          console.log('已从本地存储加载状态，角色数量:', Object.keys(this.state.characters.byId).length);
          return true;
        }
      }
    } catch (error) {
      console.error('加载状态失败:', error);
    }
    return false;
  };
} 