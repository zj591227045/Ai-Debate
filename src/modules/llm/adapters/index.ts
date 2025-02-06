import { OllamaAdapter } from './ollama';
import { DeepseekAdapter } from './deepseek';
import { SiliconFlowAdapter } from './siliconflow';
import { BaseProviderAdapter } from './base';
import { ProviderType } from '../types/providers';

const adapters: Record<string, new () => BaseProviderAdapter<any>> = {
  [ProviderType.OLLAMA]: OllamaAdapter,
  [ProviderType.DEEPSEEK]: DeepseekAdapter,
  [ProviderType.SILICONFLOW]: SiliconFlowAdapter,
};

export function createAdapter(provider: string): BaseProviderAdapter<any> {
  const AdapterClass = adapters[provider];
  if (!AdapterClass) {
    throw new Error(`未找到供应商 ${provider} 的适配器`);
  }
  return new AdapterClass();
}

export * from './base';
export * from './ollama';
export * from './deepseek';
export * from './siliconflow'; 