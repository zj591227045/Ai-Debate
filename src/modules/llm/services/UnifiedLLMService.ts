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

export interface GenerateStreamOptions {
  characterId: string;
  type: 'innerThoughts' | 'speech';
  signal?: AbortSignal;
}

export interface GenerateStreamResponse {
  content: ReadableStream;
  metadata: {
    characterId: string;
    type: 'innerThoughts' | 'speech';
    startTime: number;
  };
}

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

  async generateStream(options: GenerateStreamOptions): Promise<GenerateStreamResponse> {
    console.log('生成AI发言:', options);
    
    try {
      const provider = await this.getProvider();
      const prompt = options.type === 'innerThoughts' 
        ? '让我思考一下这个问题...'
        : '根据目前的讨论情况，我认为...';

      const request: ChatRequest = {
        message: prompt,
        systemPrompt: `你是一位专业的辩论选手，正在进行${options.type === 'innerThoughts' ? '内心独白' : '正式发言'}。`,
        stream: true
      };

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const response of provider.stream(request)) {
              const text = response.content || '';
              controller.enqueue(new TextEncoder().encode(text));
            }
            controller.close();
          } catch (error) {
            console.error('Stream generation error:', error);
            // 发生错误时，发送一个默认消息而不是直接失败
            const defaultText = options.type === 'innerThoughts'
              ? '让我思考一下这个问题...'
              : '根据目前的讨论情况，我认为...';
            controller.enqueue(new TextEncoder().encode(defaultText));
            controller.close();
          }
        }
      });

      return {
        content: stream,
        metadata: {
          characterId: options.characterId,
          type: options.type,
          startTime: Date.now()
        }
      };
    } catch (error) {
      console.error('生成AI发言失败:', error);
      // 返回一个带有默认内容的流
      const defaultContent = options.type === 'innerThoughts'
        ? '让我思考一下这个问题...'
        : '根据目前的讨论情况，我认为...';
      
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(defaultContent));
          controller.close();
        }
      });

      return {
        content: stream,
        metadata: {
          characterId: options.characterId,
          type: options.type,
          startTime: Date.now()
        }
      };
    }
  }
} 