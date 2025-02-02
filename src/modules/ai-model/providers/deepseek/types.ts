/**
 * Deepseek供应商类型定义
 */

import { Message, ModelParameters } from '../../types/common';

// Deepseek API响应类型
export interface DeepseekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
      reasoning_content?: string;
      function_call?: {
        name: string;
        arguments: string;
      };
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Deepseek流式响应类型
export interface DeepseekStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
      reasoning_content?: string;
      function_call?: {
        name?: string;
        arguments?: string;
      };
    };
    finish_reason: string | null;
  }[];
}

// Deepseek错误响应类型
export interface DeepseekError {
  error: {
    message: string;
    type: string;
    param: string | null;
    code: string;
  };
}

// Deepseek特定配置
export interface DeepseekConfig {
  apiKey: string;
  organization?: string;
  baseURL: string;
  defaultModel: string;
  timeout: number;
  maxRetries: number;
}

// Deepseek请求参数
export interface DeepseekRequestParams {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Deepseek模型信息
export interface DeepseekModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  permission: any[];
  root: string;
  parent: string | null;
}

export interface DeepseekProviderSpecific {
  model: string;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
} 