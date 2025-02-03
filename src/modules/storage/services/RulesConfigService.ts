import { BaseStorageService } from './BaseStorageService';
import { generateId } from '../utils';
import { RulesConfig } from '../types/debate';
import { RulesConfigSchema } from '../schemas/debate';

export class RulesConfigService extends BaseStorageService<RulesConfig> {
  protected storageKey = 'rules_configs';
  protected schema = RulesConfigSchema;

  /**
   * 创建新的规则配置
   */
  async createRules(params: Omit<RulesConfig, 'id'>): Promise<string> {
    const now = Date.now();
    const rules: RulesConfig = {
      ...params,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };

    await this.create(rules);
    return rules.id;
  }

  /**
   * 获取指定格式的规则配置
   */
  async getRulesByFormat(format: 'binary' | 'multi'): Promise<RulesConfig[]> {
    const rules = await this.getAll();
    return rules.filter(rule => rule.format === format);
  }

  /**
   * 获取默认规则配置
   * 如果没有默认配置，返回最基础的配置
   */
  async getDefaultRules(format: 'binary' | 'multi'): Promise<RulesConfig> {
    const rules = await this.getRulesByFormat(format);
    const defaultRules = rules.find(rule => rule.isDefault);
    
    if (defaultRules) {
      return defaultRules;
    }

    // 返回基础配置
    return {
      id: 'default',
      name: `默认${format === 'binary' ? '二元' : '多元'}规则`,
      format,
      speechRules: {
        maxLength: 1000,
        minLength: 100,
        timeLimit: 180
      },
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /**
   * 设置默认规则配置
   */
  async setDefaultRules(id: string): Promise<void> {
    const rules = await this.getById(id);
    if (!rules) {
      throw new Error('规则配置不存在');
    }

    // 获取所有同类型的规则
    const sameFormatRules = await this.getRulesByFormat(rules.format);
    
    // 更新所有规则的默认状态
    for (const rule of sameFormatRules) {
      await this.update(rule.id, {
        ...rule,
        isDefault: rule.id === id,
        updatedAt: Date.now()
      });
    }
  }

  /**
   * 验证规则配置是否合理
   */
  async validateRules(rules: RulesConfig): Promise<boolean> {
    try {
      // 基本验证
      await this.schema.parseAsync(rules);

      // 业务逻辑验证
      const { speechRules } = rules;
      
      // 检查字数限制是否合理
      if (speechRules.maxLength <= speechRules.minLength) {
        return false;
      }

      // 检查时间限制是否合理
      if (speechRules.timeLimit && speechRules.timeLimit < 30) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * 复制现有规则配置
   */
  async duplicateRules(id: string, newName?: string): Promise<string> {
    const rules = await this.getById(id);
    if (!rules) {
      throw new Error('规则配置不存在');
    }

    const now = Date.now();
    const newRules: RulesConfig = {
      ...rules,
      id: generateId(),
      name: newName || `${rules.name} (副本)`,
      isDefault: false,
      createdAt: now,
      updatedAt: now
    };

    await this.create(newRules);
    return newRules.id;
  }
} 