// 支持的模型提供商
export type ModelProvider = 'openai' | 'anthropic' | 'gemini' | 'custom';

// 预设模型配置类型
export interface PresetModelConfig {
  endpoints: {
    default: string;
    [key: string]: string;
  };
  models: string[];
}

// 预设模型配置
export const PRESET_MODELS: Record<Exclude<ModelProvider, 'custom'>, PresetModelConfig> = {
  openai: {
    endpoints: {
      default: 'https://api.openai.com/v1',
      azure: 'https://YOUR_RESOURCE_NAME.openai.azure.com/'
    },
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
  },
  anthropic: {
    endpoints: {
      default: 'https://api.anthropic.com/v1'
    },
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-2.1']
  },
  gemini: {
    endpoints: {
      default: 'https://generativelanguage.googleapis.com/v1'
    },
    models: ['gemini-pro']
  }
};

// 模型配置接口
export interface ModelConfig {
  provider: ModelProvider;
  modelName: string;
  apiKey: string;
  apiEndpoint?: string;
  customConfig?: {
    providerName: string;
    apiVersion?: string;
    modelParameters?: Record<string, any>;
    headers?: Record<string, string>;
  };
}

// 模型参数配置
export interface ModelParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

// 模型响应格式
export interface ModelResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: {
    model: string;
    finishReason?: string;
  };
}
