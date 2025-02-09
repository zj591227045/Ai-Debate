import { moduleStore } from './store';
import { ProviderFactory } from './provider/factory';
import type { ModelConfig } from '../types/config';

export async function initializeProviders(configs: ModelConfig[] = []): Promise<void> {
  const providers = new Map();
  
  for (const config of configs) {
    try {
      const provider = ProviderFactory.createProvider(config);
      await provider.initialize();
      providers.set(config.model, provider);
    } catch (error) {
      console.error(`初始化供应商失败 ${config.provider}:`, error);
    }
  }

  moduleStore.setState({
    providers,
    currentModelId: '',
    isReady: true
  });
}