import { Service } from 'typedi';
import { ModelConfig, ModelParameters, AuthConfig, ProviderConfig } from '../types/config';
import { PROVIDER_CONFIGS } from '../config/providers';
import { UnifiedLLMService } from '../../llm/services/UnifiedLLMService';
import { ProviderType } from '../../llm/types/providers';
import { LLMError, LLMErrorCode } from '../../llm/types/error';
import { StoreManager } from '@state/core/StoreManager';

@Service()
export class ModelService {
  private llmService: UnifiedLLMService;
  private storeManager: StoreManager;

  constructor() {
    this.llmService = UnifiedLLMService.getInstance();
    this.storeManager = StoreManager.getInstance();
  }

  /**
   * 获取所有支持的供应商配置
   */
  getProviderConfigs(): ProviderConfig[] {
    return Object.values(PROVIDER_CONFIGS);
  }

  /**
   * 获取指定供应商的配置
   */
  getProviderConfig(provider: ProviderType): ProviderConfig | undefined {
    return PROVIDER_CONFIGS[provider];
  }

  /**
   * 获取所有模型配置
   */
  async getAllModels(): Promise<ModelConfig[]> {
    const modelStore = this.storeManager.getModelStore();
    const models = await modelStore.getAllConfigs();
    return models.map(model => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      model: model.model || '',
      isEnabled: model.isEnabled ?? true,
      createdAt: model.createdAt ?? Date.now(),
      updatedAt: model.updatedAt ?? Date.now(),
      parameters: {
        temperature: model.parameters?.temperature ?? 0.7,
        maxTokens: model.parameters?.maxTokens ?? 2048,
        topP: model.parameters?.topP ?? 0.9
      },
      auth: {
        baseUrl: model.auth?.baseUrl ?? '',
        apiKey: model.auth?.apiKey ?? '',
        organizationId: model.auth?.organizationId ?? ''
      }
    }));
  }

  /**
   * 获取指定模型配置
   */
  async getModelById(id: string): Promise<ModelConfig | null> {
    const modelStore = this.storeManager.getModelStore();
    const model = await modelStore.getConfigById(id);
    if (!model) return null;
    
    return {
      id: model.id,
      name: model.name,
      provider: model.provider,
      model: model.model || '',
      isEnabled: model.isEnabled ?? true,
      createdAt: model.createdAt ?? Date.now(),
      updatedAt: model.updatedAt ?? Date.now(),
      parameters: {
        temperature: model.parameters?.temperature ?? 0.7,
        maxTokens: model.parameters?.maxTokens ?? 2048,
        topP: model.parameters?.topP ?? 0.9
      },
      auth: {
        baseUrl: model.auth?.baseUrl ?? '',
        apiKey: model.auth?.apiKey ?? '',
        organizationId: model.auth?.organizationId ?? ''
      }
    };
  }

  /**
   * 添加新模型
   */
  async addModel(config: Omit<ModelConfig, 'id'>): Promise<ModelConfig> {
    // 验证供应商配置
    const providerConfig = this.getProviderConfig(config.provider as ProviderType);
    if (!providerConfig) {
      throw new LLMError(LLMErrorCode.PROVIDER_NOT_FOUND, `不支持的供应商: ${config.provider}`);
    }

    // 对于 Ollama、硅基流动和 OpenAI 供应商，跳过模型验证
    if (config.provider !== ProviderType.OLLAMA && 
        config.provider !== ProviderType.SILICONFLOW && 
        config.provider !== ProviderType.OPENAI) {
      const modelInfo = providerConfig.models.find(m => m.code === config.model);
      if (!modelInfo) {
        throw new LLMError(LLMErrorCode.MODEL_NOT_FOUND, `供应商 ${providerConfig.name} 不支持模型 ${config.model}`);
      }
    }

    // 验证必要参数
    if (providerConfig.requiresBaseUrl && !config.auth?.baseUrl) {
      throw new LLMError(LLMErrorCode.INVALID_CONFIG, '缺少服务器地址');
    }
    if (providerConfig.requiresApiKey && !config.auth?.apiKey) {
      throw new LLMError(LLMErrorCode.INVALID_CONFIG, '缺少API密钥');
    }

    // 验证参数范围
    if (config.parameters) {
      const { temperature, maxTokens, topP } = config.parameters;
      const ranges = providerConfig.parameterRanges;

      if (ranges.temperature && (temperature < ranges.temperature.min || temperature > ranges.temperature.max)) {
        throw new LLMError(LLMErrorCode.INVALID_CONFIG, `temperature 必须在 ${ranges.temperature.min} 到 ${ranges.temperature.max} 之间`);
      }

      if (ranges.maxTokens && (maxTokens < ranges.maxTokens.min || maxTokens > ranges.maxTokens.max)) {
        throw new LLMError(LLMErrorCode.INVALID_CONFIG, `maxTokens 必须在 ${ranges.maxTokens.min} 到 ${ranges.maxTokens.max} 之间`);
      }

      if (ranges.topP && (topP < ranges.topP.min || topP > ranges.topP.max)) {
        throw new LLMError(LLMErrorCode.INVALID_CONFIG, `topP 必须在 ${ranges.topP.min} 到 ${ranges.topP.max} 之间`);
      }
    }

    // 创建新配置
    const newConfig: ModelConfig = {
      ...config,
      id: crypto.randomUUID(),
      isEnabled: true,
      parameters: {
        temperature: config.parameters?.temperature ?? providerConfig.parameterRanges.temperature?.default ?? 0.7,
        maxTokens: config.parameters?.maxTokens ?? providerConfig.parameterRanges.maxTokens?.default ?? 2048,
        topP: config.parameters?.topP ?? providerConfig.parameterRanges.topP?.default ?? 0.9
      },
      auth: {
        baseUrl: config.auth?.baseUrl ?? providerConfig.defaultBaseUrl ?? '',
        apiKey: config.auth?.apiKey ?? '',
        organizationId: config.auth?.organizationId ?? ''
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // 保存到存储
    const modelStore = this.storeManager.getModelStore();
    await modelStore.addConfig(newConfig);

    return newConfig;
  }

  /**
   * 更新模型配置
   */
  async updateModel(id: string, updates: Partial<ModelConfig>): Promise<ModelConfig> {
    const modelStore = this.storeManager.getModelStore();
    const existing = await modelStore.getConfigById(id);
    
    if (!existing) {
      throw new LLMError(LLMErrorCode.MODEL_NOT_FOUND, `模型 ${id} 不存在`);
    }

    // 如果更新了供应商或模型，需要重新验证
    if (updates.provider || updates.model) {
      const providerConfig = this.getProviderConfig(
        (updates.provider || existing.provider) as ProviderType
      );
      if (!providerConfig) {
        throw new LLMError(LLMErrorCode.PROVIDER_NOT_FOUND, `不支持的供应商: ${updates.provider}`);
      }

      // 对于 Ollama、硅基流动和 OpenAI 供应商，跳过模型验证
      const provider = updates.provider || existing.provider;
      if (provider !== ProviderType.OLLAMA && 
          provider !== ProviderType.SILICONFLOW && 
          provider !== ProviderType.OPENAI) {
        const modelCode = updates.model || existing.model;
        const modelInfo = providerConfig.models.find(m => m.code === modelCode);
        if (!modelInfo) {
          throw new LLMError(LLMErrorCode.MODEL_NOT_FOUND, `供应商 ${providerConfig.name} 不支持模型 ${modelCode}`);
        }
      }
    }

    const updated: ModelConfig = {
      ...existing,
      ...updates,
      model: updates.model || existing.model,
      parameters: {
        temperature: updates.parameters?.temperature ?? existing.parameters?.temperature ?? 0.7,
        maxTokens: updates.parameters?.maxTokens ?? existing.parameters?.maxTokens ?? 2048,
        topP: updates.parameters?.topP ?? existing.parameters?.topP ?? 0.9
      },
      auth: {
        baseUrl: updates.auth?.baseUrl ?? existing.auth?.baseUrl ?? '',
        apiKey: updates.auth?.apiKey ?? existing.auth?.apiKey ?? '',
        organizationId: updates.auth?.organizationId ?? existing.auth?.organizationId ?? ''
      },
      updatedAt: Date.now()
    };

    await modelStore.updateConfigById(id, updated);
    return updated;
  }

  /**
   * 删除模型配置
   */
  async deleteModel(id: string): Promise<void> {
    const modelStore = this.storeManager.getModelStore();
    await modelStore.deleteConfig(id);
  }

  /**
   * 测试模型连接
   */
  async testModel(id: string): Promise<void> {
    const config = await this.getModelById(id);
    if (!config) {
      throw new LLMError(LLMErrorCode.MODEL_NOT_FOUND, `模型 ${id} 不存在`);
    }

    await this.llmService.testConnection(config);
  }

  /**
   * 启用/禁用模型
   */
  async toggleModelStatus(id: string, enabled: boolean): Promise<ModelConfig> {
    return this.updateModel(id, { isEnabled: enabled });
  }
}