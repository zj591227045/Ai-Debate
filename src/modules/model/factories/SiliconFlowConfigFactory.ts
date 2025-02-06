import { ModelConfig, PartialModelConfig } from '../types';
import { ProviderOptions } from '../../ai-model/types/model';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_PARAMETERS = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2000,
};

export class SiliconFlowConfigFactory {
  static createInitialConfig(): PartialModelConfig {
    return {
      id: uuidv4(),
      name: '',
      provider: 'siliconflow',
      model: '',
      parameters: { ...DEFAULT_PARAMETERS },
      auth: {
        apiKey: '',
        organizationId: '',
        baseUrl: 'https://api.siliconflow.cn',
      },
      isEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  static createConfig(
    name: string,
    model: string,
    apiKey: string,
    options?: ProviderOptions
  ): ModelConfig {
    return {
      ...this.createInitialConfig(),
      name,
      model,
      auth: {
        apiKey,
        organizationId: '',
        baseUrl: options?.baseUrl || 'https://api.siliconflow.cn',
      },
    } as ModelConfig;
  }
} 