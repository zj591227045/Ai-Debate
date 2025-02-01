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
  type: 'openai' | 'anthropic' | 'volcengine' | 'deepseek' | 'xunfei' | 'aliyun' | 'baidu' | 'ollama' | 'localai';
  apiKey?: string;
  baseUrl?: string;
  models: string[];
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
    id: 'openai',
    name: 'OpenAI',
    type: 'openai',
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-2.1'],
  },
  {
    id: 'volcengine',
    name: '火山引擎',
    type: 'volcengine',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
  {
    id: 'deepseek',
    name: 'Deepseek',
    type: 'deepseek',
    models: ['deepseek-chat', 'deepseek-coder'],
  },
  {
    id: 'xunfei',
    name: '讯飞星火',
    type: 'xunfei',
    models: ['spark-v3', 'spark-v2', 'spark-v1.5'],
  },
  {
    id: 'aliyun',
    name: '通义千问',
    type: 'aliyun',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
  },
  {
    id: 'baidu',
    name: '文心一言',
    type: 'baidu',
    models: ['ernie-4.0', 'ernie-3.5-turbo', 'ernie-3.5'],
  },
  {
    id: 'ollama',
    name: 'Ollama',
    type: 'ollama',
    models: ['llama2', 'mistral', 'mixtral'],
  },
  {
    id: 'localai',
    name: 'LocalAI',
    type: 'localai',
    models: ['llama2', 'mistral', 'mixtral'],
  },
];

// 默认参数范围
export const DEFAULT_PARAMETER_RANGES: ModelParameterRange = {
  temperature: { min: 0, max: 2, step: 0.1, default: 0.7 },
  topP: { min: 0, max: 1, step: 0.1, default: 0.9 },
  maxTokens: { min: 1, max: 4096, step: 1, default: 2000 },
  presencePenalty: { min: -2, max: 2, step: 0.1, default: 0 },
  frequencyPenalty: { min: -2, max: 2, step: 0.1, default: 0 },
}; 