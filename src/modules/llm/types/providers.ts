/**
 * LLM供应商特定配置类型定义
 */

import { BaseProviderConfig } from './index';
import { Message } from './common';
import { ApiConfig, ModelConfig } from './config';
import type { ChatRequest, ChatResponse } from '../api/types';

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
  SILICONFLOW = 'siliconflow'
}

export const PROVIDERS = ProviderType;

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
  | SiliconFlowConfig;

export interface ModelProvider {
  initialize(skipModelValidation?: boolean): Promise<void>;
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

/**
 * LLM供应商接口
 */
export interface LLMProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
  stream(request: ChatRequest): AsyncGenerator<ChatResponse>;
  validateConfig(): Promise<void>;
} 