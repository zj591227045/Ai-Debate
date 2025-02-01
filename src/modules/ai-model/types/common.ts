/**
 * AI模型管理模块的通用类型定义
 */

// 模型供应商类型
export type ModelProvider = 
  | 'openai'
  | 'anthropic'
  | 'volcengine'
  | 'deepseek'
  | 'xunfei'
  | 'aliyun'
  | 'baidu'
  | 'local'
  | 'ollama'
  | 'localai';

// 模型角色类型
export type ModelRole = 'system' | 'user' | 'assistant' | 'function';

// 基础消息类型
export interface Message {
  role: ModelRole;
  content: string;
  name?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

// 模型参数配置
export interface ModelParameters {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stop?: string[];
}

// 模型响应格式
export interface ModelResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    model: string;
    finishReason?: string;
  };
}

// 错误类型定义
export interface ModelError {
  code: string;
  message: string;
  type: 'auth' | 'rate_limit' | 'invalid_request' | 'server' | 'timeout' | 'unknown';
  retryable: boolean;
}

// 模型能力定义
export interface ModelCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  maxContextTokens: number;
  maxResponseTokens: number;
  multipleCompletions: boolean;
}

// 成本计算单位
export interface CostUnit {
  promptTokens: number;
  completionTokens: number;
  currency: string;
} 