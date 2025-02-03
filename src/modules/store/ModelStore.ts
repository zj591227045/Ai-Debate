import { BaseStore, StoreState, BaseEntity } from './BaseStore';
import { ModelConfig } from '../model/types';
import { z } from 'zod';
import { generateId } from '../storage/utils';

// 扩展 ModelConfig 以包含基础实体字段
export interface StoredModelConfig extends Omit<ModelConfig, 'id'>, BaseEntity {
  isEnabled: boolean;
  isDefault?: boolean;
  providerSpecific?: Record<string, any>;
}

// 创建模型配置参数类型
export type CreateModelConfigParams = Omit<StoredModelConfig, keyof BaseEntity>;

// 参数配置验证模式
const ParametersSchema = z.object({
  temperature: z.number(),
  topP: z.number(),
  maxTokens: z.number(),
  presencePenalty: z.number().optional(),
  frequencyPenalty: z.number().optional(),
  stop: z.array(z.string()).optional(),
});

// 认证配置验证模式
const AuthConfigSchema = z.object({
  baseUrl: z.string(),
  apiKey: z.string().optional(),
  organizationId: z.string().optional(),
});

// 模型配置验证模式
const ModelConfigSchema = z.object({
  // 基础实体字段
  id: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  
  // ModelConfig 字段
  name: z.string(),
  provider: z.string(),
  model: z.string(),
  parameters: ParametersSchema,
  auth: AuthConfigSchema,
  
  // 扩展字段
  isEnabled: z.boolean(),
  isDefault: z.boolean().optional(),
  providerSpecific: z.record(z.any()).optional(),
});

export class ModelStore extends BaseStore<StoredModelConfig> {
  protected storageKey = 'model_configs';
  protected schema = ModelConfigSchema;
  protected state: StoreState<StoredModelConfig> = {};

  protected setState(state: StoreState<StoredModelConfig>): void {
    this.state = state;
  }

  protected getState(): StoreState<StoredModelConfig> {
    return this.state;
  }

  /**
   * 添加模型配置
   */
  async addModel(config: CreateModelConfigParams): Promise<string> {
    const now = Date.now();
    const id = generateId();
    
    const fullConfig: StoredModelConfig = {
      ...config,
      id,
      createdAt: now,
      updatedAt: now,
      isEnabled: config.isEnabled ?? true,
      providerSpecific: config.providerSpecific ?? {},
      auth: config.auth ?? {
        baseUrl: '',
        apiKey: '',
        organizationId: '',
      }
    };

    const state = this.getState();
    state[id] = fullConfig;
    await this.save();
    
    return id;
  }

  /**
   * 更新模型配置
   */
  async updateModel(id: string, updates: Partial<StoredModelConfig>): Promise<void> {
    const config = await this.getById(id);
    if (!config) {
      throw new Error('模型配置不存在');
    }

    const state = this.getState();
    state[id] = {
      ...config,
      ...updates,
      updatedAt: Date.now()
    };
    await this.save();
  }

  /**
   * 删除模型配置
   */
  async deleteModel(id: string): Promise<void> {
    const state = this.getState();
    delete state[id];
    await this.save();
  }

  /**
   * 获取指定供应商的模型配置
   */
  async getModelsByProvider(provider: string): Promise<StoredModelConfig[]> {
    const configs = await this.getAll();
    return configs.filter(config => config.provider === provider);
  }

  /**
   * 启用/禁用模型配置
   */
  async toggleEnabled(id: string, isEnabled: boolean): Promise<void> {
    await this.updateModel(id, { isEnabled });
  }

  /**
   * 设置默认配置
   */
  async setDefault(id: string): Promise<void> {
    const configs = await this.getAll();
    
    // 更新所有配置的默认状态
    for (const config of configs) {
      await this.updateModel(config.id, {
        isDefault: config.id === id
      });
    }
  }
} 