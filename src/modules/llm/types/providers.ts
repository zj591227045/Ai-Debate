/**
 * LLM供应商特定配置类型定义
 */

import { BaseProviderConfig } from './index';
import { Message } from './common';
import { ApiConfig, ModelConfig } from './config';

/**
 * Ollama供应商配置
 */
export interface OllamaConfig extends BaseProviderConfig {
  useLocalEndpoint?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
    stop?: string[];
  };
}

/**
 * Deepseek供应商配置
 */
export interface DeepseekConfig extends BaseProviderConfig {
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
}

/**
 * 火山引擎供应商配置
 */
export interface VolcengineConfig extends BaseProviderConfig {
  apiSecret: string;
  endpointId: string;
  options?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
  };
}

/**
 * SiliconFlow供应商配置
 */
export interface SiliconFlowConfig extends BaseProviderConfig {
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
}

/**
 * 供应商常量定义
 */
export const PROVIDERS = {
  OLLAMA: 'ollama',
  DEEPSEEK: 'deepseek',
  SILICONFLOW: 'siliconflow',
  VOLCENGINE: 'volcengine'
} as const;

export type ProviderType = typeof PROVIDERS[keyof typeof PROVIDERS];

/**
 * 供应商工厂接口
 */
export interface ProviderFactory {
  createProvider(type: ProviderType, config: BaseProviderConfig): Promise<any>;
  validateConfig(type: ProviderType, config: BaseProviderConfig): Promise<boolean>;
}

/**
 * 供应商配置联合类型
 */
export type ProviderSpecificConfig = 
  | OllamaConfig
  | DeepseekConfig
  | VolcengineConfig
  | SiliconFlowConfig;

export interface ModelProvider {
  initialize(): Promise<void>;
  validateConfig(): Promise<void>;
  listModels(): Promise<string[]>;
  chat(messages: Message[], config?: Partial<ModelConfig>): Promise<Message>;
  streamChat(messages: Message[], config?: Partial<ModelConfig>): AsyncGenerator<Message>;
  getCapabilities(): Promise<{
    streaming: boolean;
    functionCalling: boolean;
    maxContextTokens: number;
    maxResponseTokens: number;
    multipleCompletions: boolean;
  }>;
} 