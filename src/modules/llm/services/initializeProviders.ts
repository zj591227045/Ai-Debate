import { ProviderFactory } from './provider/factory';
import type { ModelConfig } from '../types/config';
import { StoreManager } from '../../state/core/StoreManager';
import type { LLMState } from '../../state/types/llm';
import { LLMStore } from '../../state/stores/LLMStore';

export async function initializeProviders(configs: ModelConfig[]): Promise<void> {
  const storeManager = StoreManager.getInstance();
  const llmStore = storeManager.getStore<LLMStore>('llm');

  const providers = new Map();
  
  for (const config of configs) {
    const provider = await ProviderFactory.createProvider(config);
    providers.set(config.model, provider);
  }

  llmStore.setState({
    providers,
    isReady: true
  });
}