import { ModelConfig, ModelProvider, PRESET_MODELS } from '../types/model';

export class ModelManager {
  private currentConfig: ModelConfig;

  constructor(initialConfig: ModelConfig) {
    this.currentConfig = initialConfig;
    this.validateConfig(initialConfig);
  }

  // 获取当前模型配置
  getCurrentConfig(): ModelConfig {
    return { ...this.currentConfig };
  }

  // 更新模型配置
  updateConfig(newConfig: Partial<ModelConfig>): ModelConfig {
    this.currentConfig = { ...this.currentConfig, ...newConfig };
    this.validateConfig(this.currentConfig);
    return this.getCurrentConfig();
  }

  // 切换模型提供商
  switchProvider(provider: ModelProvider, modelName?: string): ModelConfig {
    const newConfig: Partial<ModelConfig> = { provider };

    if (provider === 'custom') {
      if (!this.currentConfig.customConfig) {
        throw new Error('切换到自定义模型时必须提供customConfig');
      }
    } else {
      // 如果没有指定模型名称，使用该提供商的第一个模型
      newConfig.modelName = modelName || PRESET_MODELS[provider].models[0];
      // 使用默认端点
      newConfig.apiEndpoint = PRESET_MODELS[provider].endpoints.default;
    }

    return this.updateConfig(newConfig);
  }

  // 获取可用模型列表
  getAvailableModels(provider: Exclude<ModelProvider, 'custom'>): string[] {
    return PRESET_MODELS[provider].models;
  }

  // 验证模型配置
  private validateConfig(config: ModelConfig) {
    const { provider, modelName, customConfig } = config;

    if (provider === 'custom') {
      if (!customConfig) {
        throw new Error('自定义模型必须提供customConfig');
      }
      if (!config.apiEndpoint) {
        throw new Error('自定义模型必须提供apiEndpoint');
      }
      return;
    }

    // 验证预设模型
    const presetConfig = PRESET_MODELS[provider];
    if (!presetConfig.models.includes(modelName)) {
      throw new Error(`不支持的模型: ${modelName}`);
    }
  }

  // 获取模型参数配置
  getModelParameters(): Record<string, any> {
    if (this.currentConfig.provider === 'custom') {
      return this.currentConfig.customConfig?.modelParameters || {};
    }
    // 返回预设模型的默认参数
    return {
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
    };
  }

  // 设置模型参数
  setModelParameters(parameters: Record<string, any>): void {
    if (this.currentConfig.provider === 'custom') {
      if (!this.currentConfig.customConfig) {
        throw new Error('自定义模型必须先初始化 customConfig');
      }
      this.currentConfig.customConfig = {
        ...this.currentConfig.customConfig,
        modelParameters: parameters,
      };
    }
    // 对于预设模型，可以在这里添加参数覆盖逻辑
  }
} 