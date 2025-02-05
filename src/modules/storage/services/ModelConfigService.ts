import { ModelConfig } from '../../model/types';
import { BaseStorageService } from './BaseStorageService';
import { modelConfigSchema } from '../validation/schemas/model.schema';

export class ModelConfigService extends BaseStorageService<ModelConfig> {
  protected storageKey = 'model_configs';
  protected schema = modelConfigSchema;

  async getById(modelId: string): Promise<ModelConfig | null> {
    console.log('正在获取模型配置:', modelId);
    try {
      // 获取所有配置
      const configs = await this.getAll();
      // 查找匹配的配置
      const config = configs.find(c => c.id === modelId);
      
      console.log('模型配置查找结果:', {
        modelId,
        found: !!config,
        config
      });
      
      return config || null;
    } catch (error) {
      console.error('获取模型配置失败:', error);
      return null;
    }
  }

  async save(config: ModelConfig): Promise<void> {
    try {
      // 获取现有配置
      const configs = await this.getAll();
      // 查找是否存在
      const index = configs.findIndex(c => c.id === config.id);
      
      if (index >= 0) {
        // 更新现有配置
        configs[index] = {
          ...config,
          updatedAt: Date.now()
        };
      } else {
        // 添加新配置
        configs.push({
          ...config,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      
      // 保存所有配置
      await this.saveAll(configs);
      console.log('保存模型配置成功:', {
        modelId: config.id,
        isUpdate: index >= 0,
        configsCount: configs.length
      });
    } catch (error) {
      console.error('保存模型配置失败:', error);
      throw error;
    }
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
    const configs = await this.getAll();
    const index = configs.findIndex(c => c.id === id);
    if (index >= 0) {
      configs[index] = {
        ...configs[index],
        isEnabled,
        updatedAt: Date.now()
      };
      await this.saveAll(configs);
    }
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