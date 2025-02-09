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

export class DeepseekConfigFactory {
  static createInitialConfig(): PartialModelConfig {
    return {
      id: uuidv4(),
      name: '',
      provider: PROVIDERS.DEEPSEEK,
      model: '',
      parameters: { ...DEFAULT_PARAMETERS },
      auth: {
        apiKey: '',
        organizationId: '',
        baseUrl: 'https://api.deepseek.com',
      },
      isEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  static createConfig(partial: PartialModelConfig): ModelConfig {
    const deepseekOptions: ProviderOptions = {
      model: partial.model || '',
      options: {
        temperature: partial.parameters?.temperature ?? DEFAULT_PARAMETERS.temperature,
        top_p: partial.parameters?.topP ?? DEFAULT_PARAMETERS.topP,
        num_predict: partial.parameters?.maxTokens ?? DEFAULT_PARAMETERS.maxTokens,
      }
    };

    return {
      id: partial.id || uuidv4(),
      name: partial.name || '未命名配置',
      provider: PROVIDERS.DEEPSEEK,
      model: partial.model || '',
      parameters: {
        temperature: partial.parameters?.temperature ?? DEFAULT_PARAMETERS.temperature,
        topP: partial.parameters?.topP ?? DEFAULT_PARAMETERS.topP,
        maxTokens: partial.parameters?.maxTokens ?? DEFAULT_PARAMETERS.maxTokens,
      },
      auth: {
        apiKey: partial.auth?.apiKey || '',
        organizationId: '',
        baseUrl: partial.auth?.baseUrl || 'https://api.deepseek.com',
      },
      providerSpecific: {
        deepseek: deepseekOptions
      },
      isEnabled: partial.isEnabled ?? true,
      createdAt: partial.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
  }

  static validateConfig(config: PartialModelConfig): string[] {
    const errors: string[] = [];

    if (!config.name) {
      errors.push('请输入配置名称');
    }

    if (!config.model) {
      errors.push('请选择模型');
    }

    if (!config.auth?.apiKey) {
      errors.push('请输入 API 密钥');
    }

    return errors;
  }
} 