export interface ParameterRange {
  min: number;
  max: number;
  default: number;
  step: number;
}

export interface ModelParameters {
  temperature: number;
  topP: number;
  maxTokens: number;
}

export interface AuthConfig {
  apiKey: string;
  organizationId?: string;
  baseUrl?: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  parameters: ModelParameters;
  auth: AuthConfig;
}

export type PartialModelConfig = {
  id?: string;
  name?: string;
  provider?: string;
  model?: string;
  parameters?: Partial<ModelParameters>;
  auth?: Partial<AuthConfig>;
}

export interface ProviderConfig {
  id: string;
  name: string;
  models: string[];
  defaultBaseUrl?: string;
  requiresOrganization?: boolean;
}

export const DEFAULT_PARAMETER_RANGES = {
  temperature: {
    min: 0,
    max: 2,
    default: 0.7,
    step: 0.1,
  },
  topP: {
    min: 0,
    max: 1,
    default: 0.9,
    step: 0.1,
  },
  maxTokens: {
    min: 100,
    max: 4000,
    default: 2000,
    step: 100,
  },
} as const;

export const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultBaseUrl: 'https://api.openai.com/v1',
    requiresOrganization: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-2.1', 'claude-instant-1.2'],
    defaultBaseUrl: 'https://api.anthropic.com/v1',
  },
  {
    id: 'volcengine',
    name: '火山引擎',
    models: ['skylark-pro', 'skylark-lite', 'skylark-chat'],
    defaultBaseUrl: 'https://open.volcengineapi.com',
    requiresOrganization: true,
  },
  {
    id: 'deepseek',
    name: 'Deepseek',
    models: ['deepseek-chat', 'deepseek-coder'],
    defaultBaseUrl: 'https://api.deepseek.com/v1',
  },
  {
    id: 'xfyun',
    name: '讯飞星火',
    models: ['spark-v3', 'spark-v2', 'spark-v1.5'],
    defaultBaseUrl: 'https://spark-api.xf-yun.com/v1',
  },
  {
    id: 'aliyun',
    name: '通义千问',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/api/v1',
  },
  {
    id: 'baidu',
    name: '文心一言',
    models: ['ernie-4.0', 'ernie-3.5-turbo', 'ernie-3.5'],
    defaultBaseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    models: ['llama2', 'mistral', 'mixtral', 'codellama', 'phi'],
    defaultBaseUrl: 'http://localhost:11434',
  },
  {
    id: 'localai',
    name: 'LocalAI',
    models: ['llama2-uncensored', 'mistral-openorca', 'neural-chat'],
    defaultBaseUrl: 'http://localhost:8080/v1',
  },
]; 
