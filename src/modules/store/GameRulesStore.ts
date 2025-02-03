import { BaseStore, StoreState } from './BaseStore';
import { RulesConfig } from '../storage/types/debate';
import { RulesConfigSchema } from '../storage/schemas/debate';

export class GameRulesStore extends BaseStore<RulesConfig> {
  protected storageKey = 'game_rules';
  protected schema = RulesConfigSchema;
  protected state: StoreState<RulesConfig> = {};

  protected setState(state: StoreState<RulesConfig>): void {
    this.state = state;
  }

  protected getState(): StoreState<RulesConfig> {
    return this.state;
  }

  /**
   * 添加规则
   */
  async addRule(rule: RulesConfig): Promise<void> {
    const state = this.getState();
    state[rule.id] = rule;
    await this.save();
  }

  /**
   * 更新规则
   */
  async updateRule(id: string, updates: Partial<RulesConfig>): Promise<void> {
    const rule = await this.getById(id);
    if (!rule) {
      throw new Error('规则不存在');
    }

    const state = this.getState();
    state[id] = {
      ...rule,
      ...updates,
      updatedAt: Date.now()
    };
    await this.save();
  }

  /**
   * 删除规则
   */
  async deleteRule(id: string): Promise<void> {
    const state = this.getState();
    delete state[id];
    await this.save();
  }
} 