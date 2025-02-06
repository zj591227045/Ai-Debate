/**
 * LLM服务基础类型定义
 */

/**
 * LLM请求参数接口
 */
export interface LLMRequest {
  prompt: string;
  input: string;
  modelConfig: ModelConfig;
  parameters?: ModelParameters;
}

/**
 * LLM通用参数接口
 */
export interface ModelParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
}

/**
 * LLM响应接口
 */
export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

/**
 * LLM服务接口
 */
export interface LLMService {
  generateCompletion(request: LLMRequest): Promise<LLMResponse>;
  generateStream?(request: LLMRequest): AsyncGenerator<string>;
}

/**
 * LLM供应商接口
 */
export interface LLMProvider extends LLMService {
  validateConfig(): Promise<boolean>;
  listModels?(): Promise<string[]>;
}

/**
 * 基础供应商配置
 */
export interface BaseProviderConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
  organizationId?: string;
}

/**
 * 供应商特定配置
 */
export interface ProviderSpecificConfig extends BaseProviderConfig {
  [key: string]: any;
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
 * 模型配置接口
 */
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  isEnabled: boolean;
  parameters: ModelParameters;
  auth: AuthConfig;
  providerSpecific?: ProviderSpecificConfig;
  createdAt: number;
  updatedAt: number;
} 