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
  systemPrompt: string;
  humanPrompt?: string;
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
  private lastConfigCheck: number = 0;
  private readonly CONFIG_CHECK_INTERVAL: number = 1000; // 1秒的检查间隔

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

  private async refreshCurrentConfig(): Promise<void> {
    const currentTime = Date.now();
    // 如果距离上次检查时间不足 CONFIG_CHECK_INTERVAL，则跳过
    if (currentTime - this.lastConfigCheck < this.CONFIG_CHECK_INTERVAL) {
      return;
    }

    try {
      const modelStore = this.storeManager.getModelStore();
      const configs = await modelStore.getAllConfigs();
      const enabledConfig = configs.find(m => m.isEnabled);

      if (enabledConfig) {
        // 检查配置是否发生实质性变化
        const configChanged = !this.currentConfig || 
            this.currentConfig.id !== enabledConfig.id || 
            this.currentConfig.updatedAt !== enabledConfig.updatedAt ||
            this.currentConfig.model !== enabledConfig.model ||
            this.currentConfig.provider !== enabledConfig.provider;

        if (configChanged) {
          console.log('检测到模型配置变更:', {
            from: this.currentConfig?.model,
            to: enabledConfig.model,
            fromId: this.currentConfig?.id,
            toId: enabledConfig.id,
            fromUpdatedAt: this.currentConfig?.updatedAt,
            toUpdatedAt: enabledConfig.updatedAt
          });
          
          // 更新当前配置
          this.currentConfig = enabledConfig;
          
          // 更新 LLM Store
          const llmStore = this.getLLMStore();
          llmStore.setCurrentModel(enabledConfig.model);
          
          // 强制清理 Provider 缓存
          await this.providerManager.clearProviderCache(enabledConfig.id);
        }
      }

      this.lastConfigCheck = currentTime;
    } catch (error) {
      console.error('刷新模型配置失败:', error);
      throw error;
    }
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
    this.lastConfigCheck = Date.now();
  }

  private async getProvider(): Promise<LLMProvider> {
    try {
    if (!this.currentConfig) {
      throw new LLMError(
        LLMErrorCode.MODEL_NOT_FOUND,
        'unknown',
        new Error('No model selected')
      );
    }

      return this.providerManager.getProvider(adaptModelConfig(this.currentConfig));
    } catch (error) {
      console.error('获取 Provider 失败:', error);
      throw error;
    }
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
    
    // 确保请求中包含模型信息
    const enrichedRequest = {
      ...request,
      model: request.model || this.currentConfig?.model,
      temperature: request.temperature || this.currentConfig?.parameters?.temperature,
      topP: request.topP || this.currentConfig?.parameters?.topP,
      maxTokens: request.maxTokens || this.currentConfig?.parameters?.maxTokens
    };
    
    const streamHandler = new StreamHandler({
      timeoutMs: 30000,
      maxBufferSize: 1048576,
      signal: request.signal
    });

    try {
      for await (const response of streamHandler.handleStream(provider.stream(enrichedRequest))) {
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

    // 直接设置当前配置
    this.currentConfig = config;
    this.lastConfigCheck = Date.now();
    
    // 更新 LLM Store
    const llmStore = this.getLLMStore();
    llmStore.setCurrentModel(config.model);
    
    // 清理旧的 Provider 缓存
    await this.providerManager.clearProviderCache(config.id);
    
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
      const request: ChatRequest = {
        message: options.humanPrompt || '请根据上下文生成回应...',
        systemPrompt: options.systemPrompt,
        stream: true,
        signal: options.signal,
        model: this.currentConfig?.model,
        temperature: this.currentConfig?.parameters?.temperature,
        topP: this.currentConfig?.parameters?.topP,
        maxTokens: this.currentConfig?.parameters?.maxTokens
      };

      console.log('发送到Provider的请求:', request);

      const streamHandler = new StreamHandler({
        timeoutMs: 30000,
        maxBufferSize: 1048576,
        signal: options.signal
      });

      const stream = new ReadableStream({
        async start(controller) {
          try {
            console.group('=== 流式生成过程 ===');
            console.log('开始处理流式响应');
            let chunkCount = 0;
            let lastChunkTime = Date.now();
            
            for await (const response of streamHandler.handleStream(provider.stream(request))) {
              chunkCount++;
              const currentTime = Date.now();
              const timeSinceLastChunk = currentTime - lastChunkTime;
              
              console.log(`接收到第 ${chunkCount} 个数据块:`, {
                content: response.content,
                chunkInterval: timeSinceLastChunk,
                timestamp: currentTime
              });
              
              if (response.content) {
                const chunk = new TextEncoder().encode(response.content);
                controller.enqueue(chunk);
                console.log(`已发送数据块 ${chunkCount}:`, {
                  originalLength: response.content.length,
                  encodedLength: chunk.length,
                  content: response.content
                });
              }
              
              lastChunkTime = currentTime;
            }
            
            console.log(`流式生成完成，共处理 ${chunkCount} 个数据块`);
            controller.close();
          } catch (error) {
            console.error('流式生成错误:', error);
            controller.error(error);
          } finally {
            console.groupEnd();
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