/**
 * AI模型供应商工厂类
 */

import { ModelProvider as Provider } from '../types/common';
import { ApiConfig } from '../types/config';
import { ModelProvider, ModelProviderFactory } from '../types/providers';
import { createOpenAIProvider } from '../providers/openai';
import { createAnthropicProvider } from '../providers/anthropic';
import { createVolcengineProvider } from '../providers/volcengine';
import { createDeepseekProvider } from '../providers/deepseek';
import { createXunfeiProvider } from '../providers/xunfei';
import { createAliyunProvider } from '../providers/aliyun';
import { createBaiduProvider } from '../providers/baidu';
import { createOllamaProvider } from '../providers/ollama/factory';
import { createLocalAIProvider } from '../providers/localai/factory';
import { createSiliconFlowProvider } from '../providers/siliconflow/factory';

export class AIModelProviderFactory implements ModelProviderFactory {
  private readonly providers: Map<string, () => ModelProvider>;

  constructor() {
    this.providers = new Map();
    this.registerDefaultProviders();
  }

  private registerDefaultProviders(): void {
    // 注册默认供应商
    this.providers.set('openai', createOpenAIProvider);
    this.providers.set('anthropic', createAnthropicProvider);
    this.providers.set('volcengine', createVolcengineProvider);
    this.providers.set('deepseek', createDeepseekProvider);
    this.providers.set('xunfei', createXunfeiProvider);
    this.providers.set('aliyun', createAliyunProvider);
    this.providers.set('baidu', createBaiduProvider);
    this.providers.set('ollama', createOllamaProvider);
    this.providers.set('localai', createLocalAIProvider);
    this.providers.set('siliconflow', createSiliconFlowProvider);
  }

  // 注册供应商
  registerProvider(provider: Provider, factory: () => ModelProvider): void {
    this.providers.set(provider, factory);
  }

  // 创建供应商实例
  async createProvider(
    provider: string,
    config: ApiConfig
  ): Promise<ModelProvider> {
    const factory = this.providers.get(provider);
    if (!factory) {
      throw new Error(`不支持的供应商: ${provider}`);
    }

    const instance = factory();
    await instance.initialize(config);
    return instance;
  }

  // 获取支持的供应商列表
  getSupportedProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  // 验证供应商配置
  async validateProviderConfig(
    provider: string,
    config: ApiConfig
  ): Promise<boolean> {
    try {
      const instance = await this.createProvider(provider, config);
      return await instance.validateApiKey();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`验证供应商配置失败: ${error.message}`);
      } else {
        console.error('验证供应商配置失败: 未知错误');
      }
      return false;
    }
  }

  // 检查供应商是否已注册
  hasProvider(provider: string): boolean {
    return this.providers.has(provider);
  }

  // 移除供应商
  removeProvider(provider: string): boolean {
    return this.providers.delete(provider);
  }

  // 获取供应商实例的工厂方法
  getProviderFactory(provider: string): (() => ModelProvider) | undefined {
    return this.providers.get(provider);
  }

  // 批量注册供应商
  registerProviders(providers: Record<string, () => ModelProvider>): void {
    Object.entries(providers).forEach(([provider, factory]) => {
      this.registerProvider(provider as Provider, factory);
    });
  }

  // 创建带有重试机制的供应商实例
  async createProviderWithRetry(
    provider: string,
    config: ApiConfig,
    maxRetries: number = 3
  ): Promise<ModelProvider> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const instance = await this.createProvider(provider, config);
        const isValid = await instance.validateApiKey();
        
        if (isValid) {
          return instance;
        }
        
        throw new Error('API密钥验证失败');
      } catch (error: unknown) {
        if (error instanceof Error) {
          lastError = error;
        } else {
          lastError = new Error('发生未知错误');
        }
        
        if (attempt < maxRetries) {
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
          );
          continue;
        }
      }
    }
    
    throw lastError || new Error('创建供应商实例失败');
  }
} 