import { PROVIDERS } from '../../llm/types/providers';
import type { ProviderType } from '../../llm/types/providers';

// 模型配置
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  parameters: {
    temperature: number;
    topP: number;
    maxTokens: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    stop?: string[];
  };
}

// 供应商配置
export interface ProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  models: string[];
  defaultBaseUrl?: string;
  requiresOrganization?: boolean;
  isEnabled: boolean;
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
    id: PROVIDERS.OLLAMA,
    name: 'Ollama',
    type: PROVIDERS.OLLAMA,
    models: ['llama2', 'codellama', 'mistral'],
    defaultBaseUrl: 'http://localhost:11434',
    isEnabled: true
  },
  {
    id: PROVIDERS.DEEPSEEK,
    name: 'DeepSeek',
    type: PROVIDERS.DEEPSEEK,
    models: ['deepseek-chat'],
    defaultBaseUrl: 'https://api.deepseek.com',
    isEnabled: true
  },
  {
    id: PROVIDERS.SILICONFLOW,
    name: 'SiliconFlow',
    type: PROVIDERS.SILICONFLOW,
    models: ['silicon-chat'],
    defaultBaseUrl: 'https://api.siliconflow.cn',
    isEnabled: true
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