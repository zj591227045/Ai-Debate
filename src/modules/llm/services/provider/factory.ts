import type { ModelConfig } from '../../types/config';
import type { LLMProvider } from './base';
import { OllamaProvider } from './ollama';
import { DeepseekProvider } from './deepseek';
import { SiliconFlowProvider } from './siliconflow';
import { LLMError, LLMErrorCode } from '../../types/error';
import { PROVIDERS } from '../../types/providers';

export class ProviderFactory {
  private static readonly providers = new Map<string, new (config: ModelConfig) => LLMProvider>([
    [PROVIDERS.OLLAMA, OllamaProvider],
    [PROVIDERS.DEEPSEEK, DeepseekProvider],
    [PROVIDERS.SILICONFLOW, SiliconFlowProvider]
  ]);

  static createProvider(config: ModelConfig): LLMProvider {
    console.group('=== ProviderFactory.createProvider ===');
    console.log('Input config:', config);
    console.log('Provider ID:', config.provider);
    console.log('Available providers:', Array.from(this.providers.keys()));
    
    // 确保供应商 ID 存在且为小写
    const providerId = config.provider.toLowerCase();
    console.log('Normalized provider ID:', providerId);
    
    // 获取对应的提供商类
    const ProviderClass = this.providers.get(providerId);
    console.log('Found Provider Class:', ProviderClass?.name);
    
    if (!ProviderClass) {
      console.error('Provider not found for:', providerId);
      console.groupEnd();
      throw new LLMError(
        LLMErrorCode.PROVIDER_NOT_FOUND,
        config.provider,
        new Error(`未找到提供商: ${config.provider}。可用的提供商: ${Array.from(this.providers.keys()).join(', ')}`)
      );
    }
    
    console.log('Creating provider instance');
    console.groupEnd();
    return new ProviderClass(config);
  }

  static registerProvider(id: string, providerClass: new (config: ModelConfig) => LLMProvider): void {
    this.providers.set(id.toLowerCase(), providerClass);
  }

  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  static isProviderSupported(provider: string): boolean {
    return this.providers.has(provider.toLowerCase());
  }
} 