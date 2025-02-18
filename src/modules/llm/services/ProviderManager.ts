/**
 * LLM供应商管理器
 */

import type { ModelConfig } from '../types/config';
import type { ModelProvider } from '../types/providers';
import { LLMProvider } from './provider/base';
import { ProviderFactory } from './provider/factory';
import { LLMError, LLMErrorCode } from '../types/error';
import { StoreManager } from '@state/core/StoreManager';

// 确保 Provider 类型包含所有必需的属性
type Provider = LLMProvider & ModelProvider;

export class ProviderManager {
  private providers: Map<string, Provider>;
  private modelConfigs: Map<string, ModelConfig>;
  private storeManager: StoreManager;

  constructor() {
    this.providers = new Map();
    this.modelConfigs = new Map();
    this.storeManager = StoreManager.getInstance();
  }

  async getProvider(config: ModelConfig, skipModelValidation = false): Promise<LLMProvider> {
    console.group('=== ProviderManager.getProvider ===');
    console.log('Input config:', config);
    
    // 验证供应商是否支持
    if (!ProviderFactory.isProviderSupported(config.provider)) {
      console.error('Provider not supported:', config.provider);
      console.groupEnd();
      throw new LLMError(
        LLMErrorCode.PROVIDER_NOT_FOUND,
        config.provider,
        new Error(`不支持的供应商: ${config.provider}`)
      );
    }

    // 使用更细粒度的缓存键，包含模型信息和更新时间
    const cacheKey = `${config.provider}::${config.auth.baseUrl}::${config.model}::${config.id}::${config.updatedAt}`;
    console.log('Cache key:', cacheKey);
    
    // 只有在不跳过模型验证时才保存配置到本地存储
    if (!skipModelValidation) {
      const modelStore = this.storeManager.getModelStore();
      const configId = config.id;
      if (configId) {
        const existingConfig = await modelStore.getById(configId);
        if (existingConfig) {
          // 检查配置是否真的需要更新
          if (existingConfig.updatedAt !== config.updatedAt ||
              existingConfig.model !== config.model ||
              existingConfig.provider !== config.provider ||
              JSON.stringify(existingConfig.parameters) !== JSON.stringify(config.parameters)) {
            await modelStore.updateModel(configId, config);
            // 清除所有与此配置相关的旧缓存
            for (const [key, _] of this.providers.entries()) {
              if (key.includes(configId)) {
                console.log('清除旧的 provider 缓存:', key);
                this.providers.delete(key);
              }
            }
          }
        } else {
          const id = await modelStore.addModel(config);
          config.id = id;
        }
      } else {
        const id = await modelStore.addModel(config);
        config.id = id;
      }
    }
    
    // 如果已经有初始化的 provider，直接返回
    let provider = this.providers.get(cacheKey);
    console.log('Existing provider:', provider);

    try {
      if (!provider) {
        console.log('Creating new provider for:', cacheKey);
        const newProvider = ProviderFactory.createProvider(config) as Provider;
        
        // 初始化 provider
        console.log('Initializing provider');
        await newProvider.initialize(skipModelValidation);
        
        // 如果需要验证模型
        if (!skipModelValidation) {
          console.log('Validating provider config');
          await newProvider.validateConfig();
        }
        
        // 缓存 provider
        this.providers.set(cacheKey, newProvider);
        provider = newProvider;
        console.log('Provider cached:', cacheKey);
      } else {
        // 即使有缓存的 provider，也要检查配置是否需要更新
        const currentConfig = await this.getModelConfig(config.id);
        if (currentConfig && currentConfig.updatedAt > config.updatedAt) {
          console.log('配置已更新，重新创建 provider');
          const newProvider = ProviderFactory.createProvider(currentConfig) as Provider;
          await newProvider.initialize(skipModelValidation);
          if (!skipModelValidation) {
            await newProvider.validateConfig();
          }
          this.providers.set(cacheKey, newProvider);
          provider = newProvider;
        }
      }
      
      if (!provider) {
        throw new Error('Failed to create or initialize provider');
      }
      
      console.groupEnd();
      return provider;
    } catch (error) {
      console.error('\n Failed to get provider:', error);
      console.groupEnd();
      
      // 如果是 LLMError，直接抛出
      if (error instanceof LLMError) {
        throw error;
      }
      
      // 否则包装为 INITIALIZATION_FAILED 错误
      throw new LLMError(
        LLMErrorCode.INITIALIZATION_FAILED,
        config.provider,
        error instanceof Error ? error : new Error('Failed to initialize provider')
      );
    }
  }

  async getModelConfig(modelId: string): Promise<ModelConfig | null> {
    // 首先尝试从内存缓存获取
    const config = this.modelConfigs.get(modelId);
    if (config) {
      return config;
    }

    // 如果内存中没有，从存储中获取
    const modelStore = this.storeManager.getModelStore();
    const storedConfig = await modelStore.getById(modelId);
    
    // 如果找到了配置，转换为 ModelConfig 类型并缓存
    if (storedConfig) {
      const modelConfig: ModelConfig = {
        id: storedConfig.id,
        name: storedConfig.name,
        provider: storedConfig.provider,
        model: storedConfig.model || '',
        parameters: {
          temperature: storedConfig.parameters?.temperature ?? 0.7,
          maxTokens: storedConfig.parameters?.maxTokens ?? 2048,
          topP: storedConfig.parameters?.topP ?? 1.0,
          ...storedConfig.parameters
        },
        auth: storedConfig.auth || { baseUrl: '', apiKey: '' },
        capabilities: {
          streaming: true,
          functionCalling: false
        },
        metadata: {
          description: '从存储加载的模型配置',
          contextWindow: 4096,
          tokenizerName: storedConfig.provider,
          pricingInfo: {
            inputPrice: 0,
            outputPrice: 0,
            unit: '1K tokens',
            currency: 'USD'
          }
        },
        isEnabled: storedConfig.isEnabled || false,
        createdAt: storedConfig.createdAt || Date.now(),
        updatedAt: storedConfig.updatedAt || Date.now()
      };
      this.modelConfigs.set(modelId, modelConfig);
      return modelConfig;
    }
    
    return null;
  }

  public async clearProviderCache(configId: string): Promise<void> {
    console.log('清理 Provider 缓存:', configId);
    
    // 删除所有包含该配置 ID 的缓存
    for (const [key, _] of this.providers.entries()) {
      if (key.includes(configId)) {
        console.log('删除缓存:', key);
        this.providers.delete(key);
      }
    }
  }
}

export default ProviderManager; 