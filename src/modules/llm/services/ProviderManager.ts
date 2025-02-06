/**
 * LLM供应商管理器
 */

import { LLMProvider, ModelConfig } from '../types';
import { ProviderType } from '../types/providers';
import { LLMError, LLMErrorCode } from '../types/error';

export class ProviderManager {
  private static instance: ProviderManager;
  private providers: Map<ProviderType, LLMProvider>;

  private constructor() {
    this.providers = new Map();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  /**
   * 注册供应商
   */
  public registerProvider(type: ProviderType, provider: LLMProvider): void {
    this.providers.set(type, provider);
  }

  /**
   * 获取供应商实例
   */
  public getProvider(type: ProviderType): LLMProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new LLMError(
        `不支持的供应商类型: ${type}`,
        LLMErrorCode.INVALID_CONFIG,
        type
      );
    }
    return provider;
  }

  /**
   * 获取所有已注册的供应商
   */
  public getProviders(): Map<ProviderType, LLMProvider> {
    return this.providers;
  }
} 