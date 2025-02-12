import { BaseStore } from '../core/BaseStore';
import { StateContainerFactory } from '../core/StateContainer';
import type { StateTransformer } from '../types/store';
import { StateLogger } from '../utils';

const logger = StateLogger.getInstance();

/**
 * 游戏配置转换器
 */
class GameConfigTransformer implements StateTransformer<DebateState, DebateState> {
  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }

    const result = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = this.deepClone(obj[key]);
      }
    }
    return result;
  }

  public deepMerge(target: any, source: any): any {
    if (typeof source !== 'object' || source === null) {
      return source;
    }
    
    if (Array.isArray(source)) {
      return [...source];
    }
    
    const result = { ...target };
    
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (source[key] === null) {
          result[key] = null;
        } else if (typeof source[key] === 'object') {
          // 如果目标对象中对应的值不是对象，则使用空对象作为基础
          const targetValue = typeof result[key] === 'object' && result[key] !== null ? result[key] : {};
          result[key] = this.deepMerge(targetValue, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  public toUnified(state: Partial<DebateState>): Partial<DebateState> {
    if (!state) return {};
    
    // 确保返回一个新的对象，避免引用问题
    const cloned = this.deepClone(state);
    
    // 如果是完整的状态更新，直接返回克隆后的状态
    if (this.isCompleteState(cloned)) {
      return cloned;
    }
    
    // 否则进行部分更新
    return cloned;
  }

  public fromUnified(state: DebateState): DebateState {
    // 确保返回一个新的对象，避免引用问题
    return this.deepClone(state);
  }

  private isCompleteState(state: Partial<DebateState>): boolean {
    if (!state?.debate) return false;
    
    const requiredProps = ['debate', 'players', 'isConfiguring'];
    return requiredProps.every(prop => prop in state);
  }
}

// 定义辅助类型
type DebateState = {
  debate: {
    topic: {
      title: string;
      description: string;
      rounds: number;
    },
    rules: {
      debateFormat: string;
      description: string;
      advancedRules: {
        speechLengthLimit: {
          min: number;
          max: number;
        };
        allowQuoting: boolean;
        requireResponse: boolean;
        allowStanceChange: boolean;
        requireEvidence: boolean;
      };
    },
    judging: {
      description: string;
      dimensions: any[];
      totalScore: number;
    }
  },
  players: any[];
  isConfiguring: boolean;
};

type TopicConfig = DebateState['debate']['topic'];
type RulesConfig = DebateState['debate']['rules'];

/**
 * 游戏配置存储类
 */
export class GameConfigStore extends BaseStore<DebateState> {
  private static instance: GameConfigStore | null = null;
  protected readonly transformer: GameConfigTransformer;
  protected data: DebateState;
  protected metadata: { lastUpdated: number };

  public static getInstance(): GameConfigStore {
    if (!GameConfigStore.instance) {
      GameConfigStore.instance = new GameConfigStore({});
    }
    return GameConfigStore.instance;
  }

  constructor(config: any) {
    super(config);
    this.transformer = new GameConfigTransformer();
    this.metadata = { lastUpdated: Date.now() };
    this.data = this.createInitialState().data;
  }

  /**
   * 创建初始状态
   */
  protected createInitialState() {
    const initialState: DebateState = {
      debate: {
        topic: {
          title: '',
          description: '',
          rounds: 0
        },
        rules: {
          debateFormat: 'structured',
          description: '',
          advancedRules: {
            speechLengthLimit: {
              min: 100,
              max: 1000
            },
            allowQuoting: true,
            requireResponse: true,
            allowStanceChange: false,
            requireEvidence: true
          }
        },
        judging: {
          description: '',
          dimensions: [],
          totalScore: 100
        }
      },
      players: [],
      isConfiguring: true
    };

    return StateContainerFactory.create(
      initialState,
      this.namespace,
      this.version
    );
  }

  /**
   * 验证状态
   */
  protected validateState(state: DebateState): boolean {
    if (!state?.debate) return false;
    
    // 验证必需的顶级属性
    const requiredProps = ['debate', 'players', 'isConfiguring'];
    if (!requiredProps.every(prop => prop in state)) return false;
    
    // 验证debate对象的必需属性
    const requiredDebateProps = ['topic', 'rules', 'judging'];
    const debate = state.debate;  // TypeScript 会推断这里 debate 一定存在
    if (!requiredDebateProps.every(prop => prop in debate)) return false;
    
    return true;
  }

  /**
   * 更新状态
   */
  public setState(newState: Partial<DebateState>): void {
    logger.debug('GameConfigStore', '开始更新状态', {
      currentState: this.data,
      newState,
      timestamp: Date.now()
    });

    try {
      // 转换状态
      const unified = this.transformer.toUnified(newState);
      if (!unified) {
        throw new Error('Invalid state after unification');
      }
      
      // 使用 transformer 的 deepMerge 方法进行深度合并
      const mergedState = this.transformer.deepMerge(this.data, unified) as DebateState;
      if (!mergedState?.debate) {
        throw new Error('Invalid state after merge');
      }
      
      // 验证合并后的状态
      if (!this.validateState(mergedState)) {
        throw new Error('Invalid state after validation');
      }
      
      // 更新状态
      this.data = mergedState;
      
      // 触发状态变更事件
      this.emit('stateChanged', this.getState());
      
      // 如果启用了持久化，则保存状态
      if (this.config.persistence?.enabled) {
        this.persist();
      }

      logger.debug('GameConfigStore', '状态更新成功', {
        finalState: this.data,
        timestamp: Date.now()
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logger.error('GameConfigStore', '状态更新失败', err);
      throw err;
    }
  }

  /**
   * 获取状态
   */
  public getState(): DebateState {
    // 不需要每次都转换，直接返回当前状态
    return this.data;
  }

  /**
   * 更新主题
   */
  public updateTopic(topic: Partial<TopicConfig>): void {
    const currentState = this.getState();
    if (!currentState?.debate) return;
    
    logger.debug('GameConfigStore', '开始更新主题', {
      currentTopic: currentState.debate.topic,
      updateTopic: topic,
      timestamp: Date.now(),
      source: 'updateTopic'
    });

    try {
      this.setState({
        ...currentState,
        debate: {
          ...currentState.debate,
          topic: {
            ...currentState.debate.topic,
            ...topic
          }
        }
      });

      logger.debug('GameConfigStore', '主题更新成功', {
        finalTopic: this.getState()?.debate?.topic || null,
        timestamp: Date.now(),
        source: 'updateTopic.success'
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logger.error('GameConfigStore', '更新主题失败', err);
      throw error;
    }
  }

  /**
   * 更新规则
   */
  public updateRules(rules: Partial<RulesConfig>): void {
    const currentState = this.getState();
    if (!currentState?.debate) return;
    
    logger.debug('GameConfigStore', '开始更新规则', {
      currentRules: currentState.debate.rules,
      updateRules: rules,
      timestamp: Date.now(),
      source: 'updateRules'
    });

    try {
      this.setState({
        ...currentState,
        debate: {
          ...currentState.debate,
          rules: {
            ...currentState.debate.rules,
            ...rules
          }
        }
      });

      logger.debug('GameConfigStore', '规则更新成功', {
        finalRules: this.getState()?.debate?.rules || null,
        timestamp: Date.now(),
        source: 'updateRules.success'
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logger.error('GameConfigStore', '更新规则失败', err);
      throw error;
    }
  }

  /**
   * 添加玩家
   * @param player 玩家信息
   */
  public addPlayer(player: any): void {
    const currentState = this.getState();
    if (!currentState?.players) return;

    this.setState({
      ...currentState,
      players: [...currentState.players, player]
    });
  }

  /**
   * 移除玩家
   * @param playerId 玩家ID
   */
  public removePlayer(playerId: string): void {
    const currentState = this.getState();
    if (!currentState?.players) return;

    this.setState({
      ...currentState,
      players: currentState.players.filter((p: { id: string }) => p.id !== playerId)
    });
  }

  /**
   * 更新规则配置
   */
  public updateRuleConfig(config: Partial<RulesConfig>): void {
    const currentState = this.getState();
    if (!currentState?.debate?.rules) return;

    this.setState({
      ...currentState,
      debate: {
        ...currentState.debate,
        rules: {
          ...currentState.debate.rules,
          ...config
        }
      }
    });
  }

  /**
   * 更新主题配置
   */
  public updateTopicConfig(topic: Partial<TopicConfig>): void {
    const currentState = this.getState();
    if (!currentState?.debate?.topic) return;

    this.setState({
      ...currentState,
      debate: {
        ...currentState.debate,
        topic: {
          ...currentState.debate.topic,
          ...topic
        }
      }
    });
  }

  /**
   * 更新玩家配置
   */
  public updatePlayers(players: any[]): void {
    const currentState = this.getState();
    if (!currentState) return;

    this.setState({
      ...currentState,
      players
    });
  }

  /**
   * 重置配置
   */
  public resetConfig(): void {
    logger.debug('GameConfigStore', '开始重置配置', {
        timestamp: Date.now(),
        source: 'resetConfig'
    });

    try {
        const initialState = this.createInitialState().data;
        this.setState(initialState);

        logger.debug('GameConfigStore', '配置重置成功', {
            finalState: this.getState(),
            timestamp: Date.now(),
            source: 'resetConfig.success'
        });
    } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        logger.error('GameConfigStore', '重置配置失败', err);
        throw error;
    }
  }
} 