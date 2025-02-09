import { BaseStore, StoreState, BaseEntity } from './BaseStore';
import { ModelConfig } from '../model/types';
import { z } from 'zod';
import { generateId } from '../storage/utils';
import { EventBus } from '../../core/events/EventBus';

// 验证模式
const ModelConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  model: z.string(),
  parameters: z.object({
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().min(1).max(4096),
    topP: z.number().min(0).max(1)
  }),
  auth: z.object({
    baseUrl: z.string(),
    apiKey: z.string().optional(),
    organizationId: z.string().optional()
  }),
  providerSpecific: z.record(z.unknown()).optional(),
  isEnabled: z.boolean(),
  isDefault: z.boolean().optional(),
  createdAt: z.number(),
  updatedAt: z.number()
});

// 扩展 ModelConfig 以包含基础实体字段
export interface StoredModelConfig extends Omit<ModelConfig, 'id'>, BaseEntity {
  isEnabled: boolean;
  isDefault?: boolean;
  providerSpecific?: Record<string, any>;
}

// 创建模型配置参数类型
export type CreateModelConfigParams = Omit<StoredModelConfig, keyof BaseEntity>;

export class ModelStore extends BaseStore<StoredModelConfig> {
  protected storageKey = 'model_configs';
  protected schema = ModelConfigSchema;
  protected state: StoreState<StoredModelConfig> = {};
  private eventBus: EventBus;

  constructor() {
    super();
    this.eventBus = EventBus.getInstance();
  }

  protected async setState(state: StoreState<StoredModelConfig>): Promise<void> {
    this.state = state;
    await this.save(); // 保存到 localStorage
    const models = await this.getAll();
    this.eventBus.emit<StoredModelConfig[]>('model_store:changed', models);
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
      auth: {
        baseUrl: config.auth?.baseUrl || '',
        apiKey: config.auth?.apiKey || '',
        organizationId: config.auth?.organizationId || '',
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

  /**
   * 订阅状态变更
   */
  subscribe(listener: (models: StoredModelConfig[]) => void): () => void {
    const handler = (models: StoredModelConfig[]) => listener(models);
    this.eventBus.on<StoredModelConfig[]>('model_store:changed', handler);
    return () => this.eventBus.off<StoredModelConfig[]>('model_store:changed', handler);
  }
} 