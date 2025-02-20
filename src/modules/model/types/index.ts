import { ProviderType } from '../../llm/types/providers';
import type { ProviderConfig, ModelInfo } from './config';
import { PROVIDERS } from './providers';

/**
 * 模型参数接口
 */
export interface ModelParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string[];
}

/**
 * 认证配置接口
 */
export interface AuthConfig {
  baseUrl: string;
  apiKey?: string;
  organizationId?: string;
}

/**
 * 模型能力接口
 */
export interface ModelCapabilities {
  streaming: boolean;
  functionCalling: boolean;
}

/**
 * 价格信息接口
 */
export interface PricingInfo {
  inputPrice: number;
  outputPrice: number;
  unit: string;
  currency: string;
}

/**
 * 模型元数据接口
 */
export interface ModelMetadata {
  description: string;
  contextWindow: number;
  tokenizerName: string;
  pricingInfo: PricingInfo;
}

/**
 * 模型配置接口
 */
export interface ModelConfig {
  id: string;
  name: string;
  provider: PROVIDERS;
  model: string;
  endpoint?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  inUse?: boolean;
  parameters?: {
    temperature: number;
    maxTokens: number;
    topP: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    stopSequences?: string[];
  };
  auth?: {
    baseUrl: string;
    apiKey?: string;
    organizationId?: string;
  };
  capabilities?: {
    streaming: boolean;
    functionCalling: boolean;
  };
  metadata?: {
    description: string;
    contextWindow: number;
    tokenizerName: string;
    pricingInfo: {
      inputPrice: number;
      outputPrice: number;
      unit: string;
      currency: string;
    };
  };
  isEnabled?: boolean;
  createdAt: number;
  updatedAt: number;
}

// 模型参数范围
export interface ModelParameterRange {
  temperature: { min: number; max: number; step: number; default: number };
  topP: { min: number; max: number; step: number; default: number };
  maxTokens: { min: number; max: number; step: number; default: number };
  presencePenalty?: { min: number; max: number; step: number; default: number };
  frequencyPenalty?: { min: number; max: number; step: number; default: number };
}

// 预设的供应商配置
export const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    name: 'Ollama',
    code: ProviderType.OLLAMA,
    description: '本地运行的开源LLM服务',
    website: 'https://ollama.ai',
    requiresApiKey: false,
    requiresBaseUrl: true,
    defaultBaseUrl: 'http://localhost:11434',
    models: [
      {
        name: 'Llama 2',
        code: 'llama2',
        description: 'Meta开源的Llama 2模型',
        contextWindow: 4096,
        maxTokens: 4096,
        features: ['对话', '代码生成', '文本补全']
      },
      {
        name: 'CodeLlama',
        code: 'codellama',
        description: 'Meta开源的代码专用模型',
        contextWindow: 4096,
        maxTokens: 4096,
        features: ['代码生成', '代码补全']
      },
      {
        name: 'Mistral',
        code: 'mistral',
        description: 'Mistral AI开源的高性能模型',
        contextWindow: 8192,
        maxTokens: 4096,
        features: ['对话', '代码生成']
      }
    ],
    parameterRanges: {
      temperature: { min: 0, max: 2, default: 0.7 },
      maxTokens: { min: 1, max: 4096, default: 2048 },
      topP: { min: 0, max: 1, default: 0.9 }
    }
  },
  {
    name: 'DeepSeek',
    code: ProviderType.DEEPSEEK,
    description: 'DeepSeek API服务',
    website: 'https://deepseek.ai',
    requiresApiKey: true,
    requiresBaseUrl: true,
    defaultBaseUrl: 'https://api.deepseek.com',
    models: [
      {
        name: 'DeepSeek Chat',
        code: 'deepseek-chat',
        description: 'DeepSeek对话模型',
        contextWindow: 4096,
        maxTokens: 4096,
        features: ['对话', '代码生成']
      }
    ],
    parameterRanges: {
      temperature: { min: 0, max: 2, default: 0.7 },
      maxTokens: { min: 1, max: 4096, default: 2048 },
      topP: { min: 0, max: 1, default: 0.9 }
    }
  },
  {
    name: 'SiliconFlow',
    code: ProviderType.SILICONFLOW,
    description: 'SiliconFlow API服务',
    website: 'https://siliconflow.ai',
    requiresApiKey: true,
    requiresBaseUrl: true,
    defaultBaseUrl: 'https://api.siliconflow.cn',
    models: [
      {
        name: 'Silicon Chat',
        code: 'silicon-chat',
        description: 'SiliconFlow对话模型',
        contextWindow: 4096,
        maxTokens: 4096,
        features: ['对话', '代码生成']
      }
    ],
    parameterRanges: {
      temperature: { min: 0, max: 2, default: 0.7 },
      maxTokens: { min: 1, max: 4096, default: 2048 },
      topP: { min: 0, max: 1, default: 0.9 }
    }
  }
];

// 默认参数范围
export const DEFAULT_PARAMETER_RANGES: ModelParameterRange = {
  temperature: { min: 0, max: 2, step: 0.1, default: 0.7 },
  topP: { min: 0, max: 1, step: 0.1, default: 0.9 },
  maxTokens: { min: 1, max: 4096, step: 1, default: 2000 },
  presencePenalty: { min: -2, max: 2, step: 0.1, default: 0 },
  frequencyPenalty: { min: -2, max: 2, step: 0.1, default: 0 },
};

export interface ModelState {
  models: ModelConfig[];
}

export type ModelAction = 
  | { type: 'ADD_MODEL'; payload: ModelConfig }
  | { type: 'UPDATE_MODEL'; payload: ModelConfig }
  | { type: 'DELETE_MODEL'; payload: string }; 