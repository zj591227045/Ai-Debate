import { ModelConfig } from '../../model/types';
import { BaseStorageService } from './BaseStorageService';
import { modelConfigSchema } from '../validation/schemas/model.schema';

export class ModelConfigService extends BaseStorageService<ModelConfig> {
  protected storageKey = 'model_configs';
  protected schema = modelConfigSchema;

  // 创建新记录时添加必要字段
  async create(data: ModelConfig): Promise<void> {
    const now = Date.now();
    const completeData = {
      ...data,
      isEnabled: data.isEnabled ?? true,
      createdAt: data.createdAt ?? now,
      updatedAt: now,
    };
    await super.create(completeData);
  }

  // 更新记录时更新时间戳
  async update(id: string, data: Partial<ModelConfig>): Promise<void> {
    const now = Date.now();
    const updateData = {
      ...data,
      updatedAt: now,
    };
    await super.update(id, updateData);
  }

  // 获取默认配置
  async getDefaultConfig(): Promise<ModelConfig | null> {
    const configs = await this.getAll();
    return configs.find(config => config.isDefault === true) || null;
  }

  // 设置默认配置
  async setDefaultConfig(id: string): Promise<void> {
    const configs = await this.getAll();
    const updatedConfigs = configs.map(config => ({
      ...config,
      isDefault: config.id === id,
      updatedAt: Date.now(),
    }));
    await this.saveAll(updatedConfigs);
  }

  // 启用/禁用配置
  async toggleConfig(id: string, isEnabled: boolean): Promise<void> {
    await this.update(id, { isEnabled });
  }

  // 根据供应商获取配置
  async getByProvider(providerId: string): Promise<ModelConfig[]> {
    const configs = await this.getAll();
    return configs.filter(config => config.provider === providerId);
  }

  // 获取启用的配置
  async getEnabledConfigs(): Promise<ModelConfig[]> {
    const configs = await this.getAll();
    return configs.filter(config => config.isEnabled);
  }

  // 验证配置是否有效
  async validateConfig(config: Partial<ModelConfig>): Promise<boolean> {
    try {
      await this.schema.parseAsync(config);
      return true;
    } catch {
      return false;
    }
  }
} 