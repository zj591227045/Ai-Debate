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

export class OllamaConfigFactory {
  static createInitialConfig(): PartialModelConfig {
    const now = Date.now();
    return {
      id: uuidv4(),
      name: '',
      provider: PROVIDERS.OLLAMA,
      model: '',
      parameters: { ...DEFAULT_PARAMETERS },
      auth: {
        apiKey: '',
        organizationId: '',
        baseUrl: 'http://localhost:11434',
      },
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  static createConfig(partial: PartialModelConfig): ModelConfig {
    const now = Date.now();
    const id = partial.id || uuidv4();

    // 确保所有必需字段都有值
    const name = partial.name?.trim() || '未命名配置';
    const model = partial.model?.trim() || '';
    const baseUrl = partial.auth?.baseUrl?.trim() || 'http://localhost:11434';

    // 创建 Ollama 特定选项
    const ollamaOptions: ProviderOptions = {
      model,
      options: {
        temperature: partial.parameters?.temperature ?? DEFAULT_PARAMETERS.temperature,
        top_p: partial.parameters?.topP ?? DEFAULT_PARAMETERS.topP,
        num_predict: partial.parameters?.maxTokens ?? DEFAULT_PARAMETERS.maxTokens,
      },
      baseUrl
    };

    // 创建完整配置
    const config: ModelConfig = {
      id,
      name,
      provider: PROVIDERS.OLLAMA,
      model,
      parameters: {
        temperature: partial.parameters?.temperature ?? DEFAULT_PARAMETERS.temperature,
        topP: partial.parameters?.topP ?? DEFAULT_PARAMETERS.topP,
        maxTokens: partial.parameters?.maxTokens ?? DEFAULT_PARAMETERS.maxTokens,
      },
      auth: {
        baseUrl,
        apiKey: partial.auth?.apiKey || '',
        organizationId: partial.auth?.organizationId || '',
      },
      providerSpecific: {
        ollama: ollamaOptions
      },
      isEnabled: partial.isEnabled ?? true,
      createdAt: partial.createdAt ?? now,
      updatedAt: now,
    };

    // 验证配置
    const errors = this.validateConfig(config);
    if (errors.length > 0) {
      console.error('配置验证失败:', errors);
      throw new Error(errors.join('; '));
    }

    return config;
  }

  static validateConfig(config: Partial<ModelConfig>): string[] {
    const errors: string[] = [];

    // 基本字段验证
    if (!config.id) {
      errors.push('配置ID不能为空');
    }

    if (!config.name?.trim()) {
      errors.push('请输入配置名称');
    }

    if (!config.model?.trim()) {
      errors.push('请选择模型');
    }

    if (!config.auth?.baseUrl?.trim()) {
      errors.push('服务地址不能为空');
    }

    // 参数验证
    if (config.parameters) {
      const { temperature, topP, maxTokens } = config.parameters;
      
      if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
        errors.push('temperature 必须在 0-2 之间');
      }
      
      if (topP !== undefined && (topP < 0 || topP > 1)) {
        errors.push('topP 必须在 0-1 之间');
      }
      
      if (maxTokens !== undefined && (maxTokens < 1 || maxTokens > 4096)) {
        errors.push('maxTokens 必须在 1-4096 之间');
      }
    } else {
      errors.push('缺少必要的参数配置');
    }

    return errors;
  }
} 