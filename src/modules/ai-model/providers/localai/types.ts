/**
 * LocalAI供应商类型定义
 */

import { Message, ModelParameters, ModelError } from '../../types/common';

// LocalAI API 响应类型
export interface LocalAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// LocalAI 流式响应类型
export interface LocalAIStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }[];
}

// LocalAI 错误响应类型
export interface LocalAIError {
  error: {
    message: string;
    type: ModelError['type'];
    param?: string;
    code?: string;
    retryable?: boolean;
  };
}

// LocalAI 配置
export interface LocalAIConfig {
  baseURL: string;
  defaultModel: string;
  timeout?: number;
  maxRetries?: number;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    seed?: number;
    max_tokens?: number;
    stop?: string[];
  };
}

// LocalAI 请求参数
export interface LocalAIRequestParams {
  model: string;
  messages: {
    role: string;
    content: string;
  }[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  repeat_penalty?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  seed?: number;
  max_tokens?: number;
  stop?: string[];
} 