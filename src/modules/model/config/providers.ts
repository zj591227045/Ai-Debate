import { ProviderType } from '../../llm/types/providers';
import type { ProviderConfig as IProviderConfig, ModelInfo as IModelInfo } from '../types/config';

export interface ProviderConfig {
  name: string;                 // 供应商名称
  code: ProviderType;          // 供应商代码
  description: string;          // 供应商描述
  website?: string;            // 供应商官网
  requiresApiKey: boolean;     // 是否需要API Key
  requiresBaseUrl: boolean;    // 是否需要基础URL
  defaultBaseUrl?: string;     // 默认基础URL
  models: ModelInfo[];         // 支持的模型列表
  parameterRanges: {          // 参数范围限制
    temperature?: { min: number; max: number; default: number };
    maxTokens?: { min: number; max: number; default: number };
    topP?: { min: number; max: number; default: number };
  };
}

export interface ModelInfo {
  name: string;               // 模型名称
  code: string;              // 模型代码
  description: string;       // 模型描述
  contextWindow: number;     // 上下文窗口大小
  maxTokens: number;        // 最大token数
  features: string[];       // 支持的特性
}

// 供应商配置映射
export const PROVIDER_CONFIGS: Record<ProviderType, IProviderConfig> = {
  [ProviderType.OLLAMA]: {
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
  [ProviderType.DEEPSEEK]: {
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
  [ProviderType.SILICONFLOW]: {
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
}; 