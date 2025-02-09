/**
 * 统一的LLM服务类
 */

import { LLMProvider } from './provider/base';
import { ProviderManager } from './ProviderManager';
import { LLMError, LLMErrorCode } from '../types/error';
import type { ChatRequest, ChatResponse, ServiceStatus } from '../api/types';
import { ModelConfig } from '../types/config';
import { moduleEventBus } from './events';
import { LLMEvents } from '../api/events';
import { moduleStore, type IStateStore, type LLMState } from './store';
import { ProviderFactory } from './provider/factory';

export class UnifiedLLMService {
  private static instance: UnifiedLLMService;
  private currentConfig: ModelConfig | null = null;
  private readonly providerManager: ProviderManager;
  private readonly store: IStateStore<LLMState>;
  private readonly eventBus = moduleEventBus;

  constructor(providerManager: ProviderManager, store: IStateStore<LLMState>) {
    this.providerManager = providerManager;
    this.store = store;
  }

  public static getInstance(): UnifiedLLMService {
    if (!UnifiedLLMService.instance) {
      UnifiedLLMService.instance = new UnifiedLLMService(
        new ProviderManager(), 
        moduleStore
      );
    }
    return UnifiedLLMService.instance;
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
    this.store.setState({
      currentModelId: modelId,
      isReady: true,
      error: undefined
    });
    this.eventBus.emit(LLMEvents.MODEL_CHANGED, modelId);
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
    const state = this.store.getState();
    return {
      isReady: state.isReady,
      currentModel: state.currentModelId,
      provider: this.currentConfig?.provider || '',
      error: state.error
    };
  }

  private async getModelConfig(modelId: string): Promise<ModelConfig | null> {
    // 从 store 或其他配置源获取模型配置
    const config = await this.providerManager.getModelConfig(modelId);
    if (!config) {
      console.warn(`未找到模型配置: ${modelId}`);
      return null;
    }
    return config;
  }

  // 添加一个新方法用于直接设置配置
  public async setModelConfig(config: ModelConfig): Promise<void> {
    this.currentConfig = config;
    this.store.setState({
      currentModelId: config.model,
      isReady: true,
      error: undefined
    });
    this.eventBus.emit(LLMEvents.MODEL_CHANGED, config.model);
    console.log('Model config set:', config);
  }
} 