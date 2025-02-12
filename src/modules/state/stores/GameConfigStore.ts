import { BaseStore } from '../core/BaseStore';
import { StateContainerFactory } from '../core/StateContainer';
import type { GameConfigState } from '../types/gameConfig';
import type { StateTransformer } from '../types/store';

/**
 * 游戏配置转换器
 */
class GameConfigTransformer implements StateTransformer<GameConfigState, GameConfigState> {
  public toUnified(state: Partial<GameConfigState>): Partial<GameConfigState> {
    if (!state) return {};
    return state;
  }

  public fromUnified(state: GameConfigState): GameConfigState {
    return state;
  }
}

/**
 * 游戏配置存储类
 */
export class GameConfigStore extends BaseStore<GameConfigState> {
  private readonly transformer: GameConfigTransformer;
  protected data: GameConfigState;
  protected metadata: { lastUpdated: number };

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
    const initialState: GameConfigState = {
      topic: {
        title: '',
        description: '',
        background: ''
      },
      rules: {
        totalRounds: 3,
        format: 'structured'
      },
      debate: {
        topic: {
          title: '',
          description: '',
        },
        rules: {
          debateFormat: 'structured',
          description: '',
          basicRules: {
            speechLengthLimit: {
              min: 100,
              max: 1000
            },
            allowEmptySpeech: false,
            allowRepeatSpeech: false
          },
          advancedRules: {
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
      ruleConfig: {
        format: 'structured',
        description: '标准辩论规则',
        basicRules: {
          maxLength: 1000,
          minLength: 100,
          allowEmptySpeech: false,
          allowRepeatSpeech: false
        },
        advancedRules: {
          allowQuoting: true,
          requireResponse: true,
          allowStanceChange: false,
          requireEvidence: true,
          maxLength: 2000,
          minLength: 200
        },
        roundRules: [],
        scoringRules: []
      },
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
  protected validateState(state: GameConfigState): boolean {
    return true; // 简化验证，实际应该添加详细的验证逻辑
  }

  /**
   * 更新状态
   */
  public setState(newState: Partial<GameConfigState>): void {
    const unified = this.transformer.toUnified(newState);
    this.data = {
      ...this.data,
      ...unified
    };
    this.metadata.lastUpdated = Date.now();
    this.emit('stateChanged', this.data);
  }

  /**
   * 获取状态
   */
  public getState(): GameConfigState {
    return this.transformer.fromUnified(this.data);
  }

  /**
   * 更新主题
   * @param topic 主题配置
   */
  public updateTopic(topic: Partial<GameConfigState['topic']>): void {
    this.setState({
      topic: { ...this.data.topic, ...topic }
    });
  }

  /**
   * 更新规则
   * @param rules 规则配置
   */
  public updateRules(rules: Partial<GameConfigState['rules']>): void {
    this.setState({
      rules: { ...this.data.rules, ...rules }
    });
  }

  /**
   * 添加玩家
   * @param player 玩家信息
   */
  public addPlayer(player: GameConfigState['players'][0]): void {
    this.setState({
      players: [...this.data.players, player]
    });
  }

  /**
   * 移除玩家
   * @param playerId 玩家ID
   */
  public removePlayer(playerId: string): void {
    this.setState({
      players: this.data.players.filter((p: { id: string }) => p.id !== playerId)
    });
  }

  /**
   * 更新规则配置
   * @param config 规则配置
   */
  public updateRuleConfig(config: Record<string, any>): void {
    this.setState({
      ruleConfig: { ...this.data.ruleConfig, ...config }
    });
  }
} 