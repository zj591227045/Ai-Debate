/**
 * LLM供应商特定配置类型定义
 */

import { BaseProviderConfig } from './index';

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
 * 供应商类型枚举
 */
export enum ProviderType {
  OLLAMA = 'ollama',
  DEEPSEEK = 'deepseek',
  VOLCENGINE = 'volcengine',
  SILICONFLOW = 'siliconflow'
}

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