/**
 * 统一的LLM服务类
 */

import { LLMProvider } from './provider/base';
import { ProviderManager } from './ProviderManager';
import { LLMError, LLMErrorCode } from '../types/error';
import type { ChatRequest, ChatResponse, ServiceStatus } from '../api/types';
import type { ModelConfig as LLMModelConfig } from '../types/config';
import type { ModelConfig as AppModelConfig } from '../../model/types';
import { moduleEventBus } from './events';
import { LLMEvents } from '../api/events';
import { StoreManager } from '../../state/core/StoreManager';
import { LLMStore } from '../../state/stores/LLMStore';
import type { LLMState } from '../../state/types/llm';
import { ProviderFactory } from './provider/factory';
import { ModelValidator } from './validator/ModelValidator';
import { StreamHandler, StreamOptions } from './stream/StreamHandler';

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

// 适配模型配置
function adaptModelConfig(config: AppModelConfig): LLMModelConfig {
  const adaptedConfig = {
    ...config,
    auth: {
      baseUrl: config.auth.baseUrl,
      apiKey: config.auth.apiKey || ''
    }
  };

  // 使用类型断言确保返回类型正确
  return adaptedConfig as LLMModelConfig;
}

export class UnifiedLLMService {
  private static instance: UnifiedLLMService;
  private currentConfig: AppModelConfig | null = null;
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
    const config = await this.getModelConfig(modelId);
    if (!config) {
      throw new LLMError(
        LLMErrorCode.MODEL_NOT_FOUND,
        modelId,
        new Error(`Model ${modelId} not found`)
      );
    }

    this.currentConfig = config;
  }

  private async getProvider(): Promise<LLMProvider> {
    if (!this.currentConfig) {
      throw new LLMError(
        LLMErrorCode.MODEL_NOT_FOUND,
        'unknown',
        new Error('No model selected')
      );
    }

    return this.providerManager.getProvider(adaptModelConfig(this.currentConfig));
  }

  async getInitializedProvider(config: AppModelConfig, skipModelValidation = false): Promise<LLMProvider> {
    return this.providerManager.getProvider(adaptModelConfig(config), skipModelValidation);
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    console.log('Chat request:', request);
    const provider = await this.getProvider();
    return provider.chat(request);
  }

  async *stream(request: ChatRequest): AsyncGenerator<ChatResponse> {
    console.log('Stream request:', request);
    const provider = await this.getProvider();
    
    const streamHandler = new StreamHandler({
      timeoutMs: 30000,
      maxBufferSize: 1048576,
      signal: request.signal
    });

    try {
      for await (const response of streamHandler.handleStream(provider.stream(request))) {
        // 确保返回的内容始终是字符串
        yield {
          ...response,
          content: response.content || ''
        };
      }
    } finally {
      streamHandler.dispose();
    }
  }

  getStatus(): ServiceStatus {
    const llmStore = this.getLLMStore();
    return llmStore.getServiceStatus();
  }

  private async getModelConfig(modelId: string): Promise<AppModelConfig | null> {
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

  public async setModelConfig(config: AppModelConfig): Promise<void> {
    // 验证配置
    const validationResult = ModelValidator.validateConfig(config);
    if (!validationResult.isValid) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        validationResult.errors.map(e => e.message).join(', '),
        new Error('Invalid model configuration')
      );
    }

    this.currentConfig = config;
    const llmStore = this.getLLMStore();
    llmStore.setCurrentModel(config.model);
    console.log('Model config set:', config);
  }

  // 测试模型连接
  public async testConnection(config: AppModelConfig): Promise<void> {
    // 验证配置
    const validationResult = ModelValidator.validateConfig(config);
    if (!validationResult.isValid) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        validationResult.errors.map(e => e.message).join(', '),
        new Error('Invalid model configuration')
      );
    }

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
        stream: true,
        signal: options.signal
      };

      const streamHandler = new StreamHandler({
        timeoutMs: 30000,
        maxBufferSize: 1048576,
        signal: options.signal
      });

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const response of streamHandler.handleStream(provider.stream(request))) {
              if (response.isError) {
                // 如果是错误响应，添加错误标记
                controller.enqueue(new TextEncoder().encode(`[错误] ${response.content || '未知错误'}`));
                controller.close();
                return;
              }
              controller.enqueue(new TextEncoder().encode(response.content || ''));
            }
            controller.close();
          } catch (error) {
            console.error('Stream generation error:', error);
            const errorMessage = error instanceof LLMError 
              ? error.message 
              : '生成过程发生错误';
            controller.enqueue(new TextEncoder().encode(`[错误] ${errorMessage}`));
            controller.close();
          } finally {
            streamHandler.dispose();
          }
        },
        cancel() {
          streamHandler.dispose();
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
      const errorMessage = error instanceof LLMError 
        ? error.message 
        : '生成过程发生错误';
      
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`[错误] ${errorMessage}`));
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