import { OllamaAdapter } from './ollama';
import { DeepseekAdapter } from './deepseek';
import { SiliconFlowAdapter } from './siliconflow';
import type { BaseProviderAdapter } from '../types/adapter';

export const adapters: Record<string, new () => BaseProviderAdapter> = {
  'ollama': OllamaAdapter,
  'deepseek': DeepseekAdapter,
  'siliconflow': SiliconFlowAdapter
};

export function getAdapter(provider: string): BaseProviderAdapter {
  const AdapterClass = adapters[provider];
  if (!AdapterClass) {
    throw new Error(`未找到适配器: ${provider}`);
  }
  return new AdapterClass();
}

export * from '../types/adapter';
export * from './ollama';
export * from './deepseek';
export * from './siliconflow'; 