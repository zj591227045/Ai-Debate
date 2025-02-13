/**
 * 统一的LLM服务类
 */

import { LLMProvider } from './provider/base';
import { ProviderManager } from './ProviderManager';
import { LLMError, LLMErrorCode } from '../types/error';
import type { ChatRequest, ChatResponse, ServiceStatus } from '../api/types';
import type { ModelConfig } from '../../model/types';
import { moduleEventBus } from './events';
import { LLMEvents } from '../api/events';
import { StoreManager } from '../../state/core/StoreManager';
import { LLMStore } from '../../state/stores/LLMStore';
import type { LLMState } from '../../state/types/llm';
import { ProviderFactory } from './provider/factory';

export class UnifiedLLMService {
  private static instance: UnifiedLLMService;
  private currentConfig: ModelConfig | null = null;
  private readonly providerManager: ProviderManager;
  private readonly storeManager: StoreManager;

  constructor(providerManager: ProviderManager) {
    this.providerManager = providerManager;
    this.storeManager = StoreManager.getInstance();
  }

  public static getInstance(): UnifiedLLMService {
    if (!UnifiedLLMService.instance) {
      UnifiedLLMService.instance = new UnifiedLLMService(
        new ProviderManager()
      );
    }
    return UnifiedLLMService.instance;
  }

  private getLLMStore(): LLMStore {
    return this.storeManager.getStore<LLMStore>('llm');
  }

  async setModel(modelId: string): Promise<void> {
    console.log('Setting model:', modelId);
    const config = await this.getModelConfig(modelId);
    if (!config) {
      throw new LLMError(
        LLMErrorCode.MODEL_NOT_FOUND,
        modelId,
        new Error('Model config not found')
      );
    }

    this.currentConfig = config;
    const llmStore = this.getLLMStore();
    llmStore.setCurrentModel(modelId);
    console.log('Model config set:', config);
  }

  private async getProvider(): Promise<LLMProvider> {
    if (!this.currentConfig) {
      throw new LLMError(
        LLMErrorCode.MODEL_NOT_FOUND,
        'unknown',
        new Error('No model selected')
      );
    }

    if (!ProviderFactory.isProviderSupported(this.currentConfig.provider)) {
      throw new LLMError(
        LLMErrorCode.PROVIDER_NOT_FOUND,
        this.currentConfig.provider,
        new Error(`不支持的供应商: ${this.currentConfig.provider}`)
      );
    }

    return this.providerManager.getProvider(this.currentConfig);
  }

  async getInitializedProvider(config: ModelConfig, skipModelValidation = false): Promise<LLMProvider> {
    if (!ProviderFactory.isProviderSupported(config.provider)) {
      throw new LLMError(
        LLMErrorCode.PROVIDER_NOT_FOUND,
        config.provider,
        new Error(`不支持的供应商: ${config.provider}`)
      );
    }
    return this.providerManager.getProvider(config, skipModelValidation);
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    console.log('Chat request:', request);
    const provider = await this.getProvider();
    return provider.chat(request);
  }

  async *stream(request: ChatRequest): AsyncGenerator<ChatResponse> {
    console.log('Stream request:', request);
    const provider = await this.getProvider();
    yield* provider.stream(request);
  }

  getStatus(): ServiceStatus {
    const llmStore = this.getLLMStore();
    return llmStore.getServiceStatus();
  }

  private async getModelConfig(modelId: string): Promise<ModelConfig | null> {
    try {
      const config = await this.providerManager.getModelConfig(modelId);
      return config;
    } catch (error) {
      console.error('Failed to get model config:', error);
      const llmStore = this.getLLMStore();
      llmStore.setError(error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  public async setModelConfig(config: ModelConfig): Promise<void> {
    this.currentConfig = config;
    const llmStore = this.getLLMStore();
    llmStore.setCurrentModel(config.model);
    console.log('Model config set:', config);
  }

  // 测试模型连接
  public async testConnection(config: ModelConfig): Promise<void> {
    try {
      const provider = await this.getInitializedProvider(config);
      await provider.validateConfig();
    } catch (error) {
      console.error('测试连接失败:', error);
      throw error;
    }
  }
} 