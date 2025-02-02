import { ModelConfig, PartialModelConfig } from '../types';
import { ProviderOptions } from '../../ai-model/types/model';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_PARAMETERS = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2000,
};

export class OllamaConfigFactory {
  static createInitialConfig(): PartialModelConfig {
    return {
      id: uuidv4(),
      name: '',
      provider: 'ollama',
      model: '',
      parameters: { ...DEFAULT_PARAMETERS },
      auth: {
        apiKey: '',
        organizationId: '',
        baseUrl: 'http://localhost:11434',
      },
    };
  }

  static createConfig(partial: PartialModelConfig): ModelConfig {
    const ollamaOptions: ProviderOptions = {
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
      provider: 'ollama',
      model: partial.model || '',
      parameters: {
        temperature: partial.parameters?.temperature ?? DEFAULT_PARAMETERS.temperature,
        topP: partial.parameters?.topP ?? DEFAULT_PARAMETERS.topP,
        maxTokens: partial.parameters?.maxTokens ?? DEFAULT_PARAMETERS.maxTokens,
      },
      auth: {
        apiKey: '',
        organizationId: '',
        baseUrl: partial.auth?.baseUrl || 'http://localhost:11434',
      },
      providerSpecific: {
        ollama: ollamaOptions
      }
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

    return errors;
  }
} 