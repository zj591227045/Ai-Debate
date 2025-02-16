import type { ModelConfig } from '../../llm/types/config';
import { BaseConfigFactory } from './BaseConfigFactory';

export class DeepseekConfigFactory extends BaseConfigFactory {
  createInitialConfig(): ModelConfig {
    return {
      id: '',
      name: '',
      provider: 'deepseek',
      model: 'deepseek-chat',
      auth: {
        baseUrl: 'https://api.deepseek.com',
        apiKey: '',
      },
      parameters: {
        temperature: 0.7,
        topP: 0.95,
        maxTokens: 2048,
        presencePenalty: 0,
        frequencyPenalty: 0,
        stopSequences: [],
      },
      capabilities: {
        streaming: true,
        functionCalling: false,
      },
      metadata: {
        description: 'Deepseek AI 提供的大语言模型服务',
        contextWindow: 8192,
        tokenizerName: 'deepseek',
        pricingInfo: {
          inputPrice: 0.0002,
          outputPrice: 0.0002,
          unit: '1K tokens',
          currency: 'USD'
        }
      },
      isEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  validateConfig(config: ModelConfig): string[] {
    const errors: string[] = [];

    if (!config.auth.baseUrl) {
      errors.push('缺少服务地址');
    }

    if (!config.auth.apiKey) {
      errors.push('缺少 API 密钥');
    }

    if (!config.model) {
      errors.push('缺少模型名称');
    }

    if (config.parameters) {
      if (config.parameters.temperature < 0 || config.parameters.temperature > 1) {
        errors.push('temperature 必须在 0 到 1 之间');
      }

      if (config.parameters.topP < 0 || config.parameters.topP > 1) {
        errors.push('topP 必须在 0 到 1 之间');
      }

      if (config.parameters.maxTokens < 1) {
        errors.push('maxTokens 必须大于 0');
      }
    }

    return errors;
  }
} 