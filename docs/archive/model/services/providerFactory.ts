import type { ModelConfig } from '../types';
import type { LLMProvider } from '../../llm/services/provider/base';
import { OllamaProvider } from '../../llm/services/provider/ollama';
import { DeepseekProvider } from '../../llm/services/provider/deepseek';
import { SiliconFlowProvider } from '../../llm/services/provider/siliconflow';
import { PROVIDERS } from '../../llm/types/providers';

class ModelProviderFactory {
  private providers = new Map<string, new (config: ModelConfig) => LLMProvider>();

  constructor() {
    this.providers.set(PROVIDERS.OLLAMA, OllamaProvider);
    this.providers.set(PROVIDERS.DEEPSEEK, DeepseekProvider);
    this.providers.set(PROVIDERS.SILICONFLOW, SiliconFlowProvider);
  }

  createProvider(config: ModelConfig): LLMProvider {
    const Provider = this.providers.get(config.provider.toLowerCase());
    if (!Provider) {
      throw new Error(`未找到提供者: ${config.provider}`);
    }
    return new Provider(config);
  }

  registerProvider(name: string, provider: new (config: ModelConfig) => LLMProvider): void {
    this.providers.set(name.toLowerCase(), provider);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

export const providerFactory = new ModelProviderFactory();