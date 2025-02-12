import { BaseStore } from '../core/BaseStore';
import { StateContainerFactory } from '../core/StateContainer';
import { GameRulesState, StateContainer } from '../types';

/**
 * 游戏规则存储类
 */
export class GameRulesStore extends BaseStore<GameRulesState> {
  /**
   * 创建初始状态
   */
  protected createInitialState(): StateContainer<GameRulesState> {
    const initialState: GameRulesState = {
      currentRuleSet: 'default',
      ruleConfig: {
        roundRules: [
          {
            round: 1,
            format: 'opening'
          },
          {
            round: 2,
            format: 'debate'
          },
          {
            round: 3,
            format: 'debate'
          },
          {
            round: 4,
            format: 'closing'
          }
        ],
        scoringRules: [
          {
            criterion: 'logic',
            weight: 0.4
          },
          {
            criterion: 'evidence',
            weight: 0.3
          },
          {
            criterion: 'presentation',
            weight: 0.3
          }
        ]
      },
      customRules: {}
    };

    return StateContainerFactory.create(
      initialState,
      this.namespace,
      this.version
    );
  }

  /**
   * 验证状态
   * @param state 待验证的状态
   */
  protected validateState(state: GameRulesState): boolean {
    if (!state || typeof state !== 'object') {
      return false;
    }

    const { currentRuleSet, ruleConfig, customRules } = state;

    // 验证当前规则集
    if (typeof currentRuleSet !== 'string') {
      return false;
    }

    // 验证规则配置
    if (!ruleConfig || typeof ruleConfig !== 'object') {
      return false;
    }

    // 验证回合规则
    if (!Array.isArray(ruleConfig.roundRules)) {
      return false;
    }
    for (const rule of ruleConfig.roundRules) {
      if (!rule || typeof rule !== 'object') {
        return false;
      }
      if (typeof rule.round !== 'number' || rule.round < 1) {
        return false;
      }
      if (typeof rule.format !== 'string') {
        return false;
      }
    }

    // 验证评分规则
    if (!Array.isArray(ruleConfig.scoringRules)) {
      return false;
    }
    for (const rule of ruleConfig.scoringRules) {
      if (!rule || typeof rule !== 'object') {
        return false;
      }
      if (typeof rule.criterion !== 'string') {
        return false;
      }
      if (typeof rule.weight !== 'number' || rule.weight < 0 || rule.weight > 1) {
        return false;
      }
    }

    // 验证自定义规则
    if (typeof customRules !== 'object') {
      return false;
    }

    return true;
  }

  /**
   * 设置当前规则集
   * @param ruleSet 规则集名称
   */
  public setCurrentRuleSet(ruleSet: string): void {
    this.setState({ currentRuleSet: ruleSet });
  }

  /**
   * 更新回合规则
   * @param round 回合数
   * @param rule 规则更新
   */
  public updateRoundRule(
    round: number,
    rule: Partial<GameRulesState['ruleConfig']['roundRules'][0]>
  ): void {
    const roundRules = [...this.state.data.ruleConfig.roundRules];
    const index = roundRules.findIndex(r => r.round === round);
    if (index === -1) {
      throw new Error(`Round ${round} not found`);
    }
    roundRules[index] = { ...roundRules[index], ...rule };
    this.setState({
      ruleConfig: {
        ...this.state.data.ruleConfig,
        roundRules
      }
    });
  }

  /**
   * 更新评分规则
   * @param criterion 评分标准
   * @param rule 规则更新
   */
  public updateScoringRule(
    criterion: string,
    rule: Partial<GameRulesState['ruleConfig']['scoringRules'][0]>
  ): void {
    const scoringRules = [...this.state.data.ruleConfig.scoringRules];
    const index = scoringRules.findIndex(r => r.criterion === criterion);
    if (index === -1) {
      throw new Error(`Criterion ${criterion} not found`);
    }
    scoringRules[index] = { ...scoringRules[index], ...rule };
    this.setState({
      ruleConfig: {
        ...this.state.data.ruleConfig,
        scoringRules
      }
    });
  }

  /**
   * 添加自定义规则
   * @param key 规则键名
   * @param value 规则值
   */
  public setCustomRule(key: string, value: any): void {
    this.setState({
      customRules: {
        ...this.state.data.customRules,
        [key]: value
      }
    });
  }

  /**
   * 移除自定义规则
   * @param key 规则键名
   */
  public removeCustomRule(key: string): void {
    const customRules = { ...this.state.data.customRules };
    delete customRules[key];
    this.setState({ customRules });
  }

  /**
   * 获取回合规则
   * @param round 回合数
   */
  public getRoundRule(round: number) {
    return this.state.data.ruleConfig.roundRules.find(r => r.round === round);
  }

  /**
   * 获取评分规则
   * @param criterion 评分标准
   */
  public getScoringRule(criterion: string) {
    return this.state.data.ruleConfig.scoringRules.find(
      r => r.criterion === criterion
    );
  }
} 