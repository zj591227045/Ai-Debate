import { ModelProvider } from '../../types/providers';
import { ApiConfig } from '../../types/config';
import { SiliconFlowProvider } from './provider';

export function createSiliconFlowProvider(): ModelProvider {
  const provider = new SiliconFlowProvider();
  return provider;
} 