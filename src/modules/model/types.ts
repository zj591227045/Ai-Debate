import type { ModelParameters, AIModelConfig, ApiConfig } from '../ai-model/types/model';
import { BaseEntity } from '../storage/validation/schemas/base.schema';

export type { ModelParameters };

export interface AuthConfig extends Omit<ApiConfig, 'providerSpecific' | 'apiKey'> {
  baseUrl: string;
  apiKey?: string;
  organizationId?: string;
}

export interface ModelConfig extends BaseEntity {
  name: string;
  provider: string;
  model: string;
  parameters: ModelParameters;
  auth: AuthConfig;
  providerSpecific?: {
    [key: string]: any;
  };
  isDefault?: boolean;
  isEnabled: boolean;
}

export type PartialModelConfig = {
  id?: string;
  name?: string;
  provider?: string;
  model?: string;
  parameters?: Partial<ModelParameters>;
  auth?: Partial<AuthConfig>;
  providerSpecific?: {
    [key: string]: any;
  };
  isEnabled?: boolean;
  createdAt?: number;
  updatedAt?: number;
  isDefault?: boolean;
};

export const DEFAULT_PARAMETER_RANGES = {
  temperature: {
    min: 0,
    max: 2,
    step: 0.1,
    default: 0.7,
  },
  topP: {
    min: 0,
    max: 1,
    step: 0.1,
    default: 0.9,
  },
  maxTokens: {
    min: 100,
    max: 4000,
    step: 100,
    default: 2000,
  },
};

export interface ModelProvider {
  id: string;
  name: string;
  models: string[];
  defaultBaseUrl?: string;
  requiresApiKey: boolean;
}

export interface ProviderConfig {
  id: string;
  name: string;
  models: string[];
  defaultBaseUrl?: string;
  requiresOrganization?: boolean;
  isEnabled: boolean;
}

export const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultBaseUrl: 'https://api.openai.com/v1',
    requiresOrganization: true,
    isEnabled: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-2.1', 'claude-instant-1.2'],
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    isEnabled: true,
  },
  {
    id: 'volcengine',
    name: '火山引擎',
    models: ['skylark-pro', 'skylark-lite', 'skylark-chat'],
    defaultBaseUrl: 'https://open.volcengineapi.com',
    requiresOrganization: true,
    isEnabled: true,
  },
  {
    id: 'deepseek',
    name: 'Deepseek',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
    defaultBaseUrl: 'https://api.deepseek.com',
    isEnabled: true,
  },
  {
    id: 'xfyun',
    name: '讯飞星火',
    models: ['spark-v3', 'spark-v2', 'spark-v1.5'],
    defaultBaseUrl: 'https://spark-api.xf-yun.com/v1',
    isEnabled: true,
  },
  {
    id: 'aliyun',
    name: '通义千问',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    isEnabled: true,
  },
  {
    id: 'baidu',
    name: '文心一言',
    models: ['ernie-4.0', 'ernie-3.5-turbo', 'ernie-3.5'],
    defaultBaseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
    isEnabled: true,
  },
  {
    id: 'ollama',
    name: 'Ollama',
    models: ['llama2', 'mistral', 'mixtral', 'codellama', 'phi'],
    defaultBaseUrl: 'http://localhost:11434',
    isEnabled: true,
  },
  {
    id: 'localai',
    name: 'LocalAI',
    models: ['llama2-uncensored', 'mistral-openorca', 'neural-chat'],
    defaultBaseUrl: 'http://localhost:8080/v1',
    isEnabled: true,
  },
]; 
