/**
 * 统一的LLM服务类
 */

import { LLMRequest, LLMResponse, LLMService, ModelConfig } from '../types';
import { ProviderManager } from './ProviderManager';
import { LLMError, LLMErrorCode } from '../types/error';
import { ProviderType } from '../types/providers';
import { ProviderAdapter } from '../adapters/base';

export class UnifiedLLMService implements LLMService {
  private providerManager: ProviderManager;
  private initializedProviders: Map<string, boolean>;

  constructor() {
    this.providerManager = ProviderManager.getInstance();
    this.initializedProviders = new Map();
  }

  /**
   * 获取并初始化供应商实例
   * @param config 模型配置
   * @param skipModelValidation 是否跳过模型验证
   */
  public async getInitializedProvider(config: ModelConfig, skipModelValidation = false): Promise<ProviderAdapter> {
    console.group('=== 获取供应商实例 ===');
    console.log('配置信息:', config);
    console.log('跳过模型验证:', skipModelValidation);
    
    const provider = this.providerManager.getProvider(config.provider as ProviderType) as ProviderAdapter;
    console.log('获取到供应商:', config.provider);
    
    const providerId = `${config.provider}-${config.id}`;
    console.log('供应商ID:', providerId);
    console.log('是否已初始化:', this.initializedProviders.get(providerId));

    // 检查是否已经初始化过
    if (!this.initializedProviders.get(providerId)) {
      console.log('供应商未初始化，开始初始化...');
      if (!config.providerSpecific) {
        console.error('供应商配置缺失');
        throw new LLMError(
          '供应商配置缺失',
          LLMErrorCode.INVALID_CONFIG,
          config.provider
        );
      }
      
      try {
        console.log('初始化配置:', config.providerSpecific);
        await provider.initialize(config.providerSpecific, skipModelValidation);
        console.log('供应商初始化成功');
        this.initializedProviders.set(providerId, true);
      } catch (error) {
        console.error('供应商初始化失败:', error);
        throw error;
      }
    } else {
      console.log('供应商已初始化，跳过初始化步骤');
    }

    console.groupEnd();
    return provider;
  }

  /**
   * 生成完成响应
   */
  public async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    try {
      // 获取并初始化供应商实例
      const provider = await this.getInitializedProvider(request.modelConfig);

      // 格式化请求
      const formattedRequest = this.formatRequest(request);

      // 调用供应商API
      const response = await provider.generateCompletion(formattedRequest);

      // 格式化响应
      return this.formatResponse(response, request.modelConfig);
    } catch (error) {
      throw this.handleError(error, request.modelConfig);
    }
  }

  /**
   * 生成流式响应
   */
  public async *generateStream(request: LLMRequest): AsyncGenerator<string> {
    try {
      // 获取并初始化供应商实例
      const provider = await this.getInitializedProvider(request.modelConfig);
      
      if (!provider.generateStream) {
        throw new LLMError(
          '供应商不支持流式输出',
          LLMErrorCode.API_ERROR,
          request.modelConfig.provider
        );
      }

      const formattedRequest = this.formatRequest(request);
      const stream = await provider.generateStream(formattedRequest);

      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      throw this.handleError(error, request.modelConfig);
    }
  }

  /**
   * 格式化请求
   */
  private formatRequest(request: LLMRequest): LLMRequest {
    return {
      ...request,
      parameters: {
        ...request.modelConfig.parameters,  // 默认参数
        ...request.parameters,             // 请求特定参数
      }
    };
  }

  /**
   * 格式化响应
   */
  private formatResponse(
    response: LLMResponse,
    config: ModelConfig
  ): LLMResponse {
    return {
      content: response.content,
      usage: response.usage,
      metadata: {
        ...response.metadata,
        provider: config.provider,
        model: config.model,
      }
    };
  }

  /**
   * 处理错误
   */
  private handleError(error: unknown, config: ModelConfig): LLMError {
    if (error instanceof LLMError) {
      return error;
    }

    return new LLMError(
      error instanceof Error ? error.message : '未知错误',
      LLMErrorCode.UNKNOWN,
      config.provider,
      error instanceof Error ? error : undefined
    );
  }
} 