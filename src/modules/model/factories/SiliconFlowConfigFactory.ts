import { ModelConfig, PartialModelConfig } from '../types';
import { ModelCapabilities } from '../../llm/types/common';
import { PROVIDERS } from '../../llm/types/providers';
import { v4 as uuidv4 } from 'uuid';

interface ProviderOptions {
  model: string;
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
    stop?: string[];
  };
  baseUrl?: string;
}

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
      provider: PROVIDERS.SILICONFLOW,
      model: '',
      parameters: { ...DEFAULT_PARAMETERS },
      auth: {
        apiKey: '',
        organizationId: '',
        baseUrl: '',
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
    if (!apiKey) {
      throw new Error('硅基流动 API 密钥是必需的');
    }

    if (!options?.baseUrl) {
      throw new Error('硅基流动服务地址是必需的');
    }

    return {
      ...this.createInitialConfig(),
      name,
      model,
      auth: {
        apiKey,
        organizationId: '',
        baseUrl: options.baseUrl,
      },
    } as ModelConfig;
  }

  static validateConfig(config: PartialModelConfig): string[] {
    const errors: string[] = [];

    if (!config.auth?.apiKey) {
      errors.push('硅基流动 API 密钥是必需的');
    }

    if (!config.auth?.baseUrl) {
      errors.push('硅基流动服务地址是必需的');
    }

    if (!config.model) {
      errors.push('请选择一个模型');
    }

    return errors;
  }
} 