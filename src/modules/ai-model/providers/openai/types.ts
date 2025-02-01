/**
 * OpenAI供应商类型定义
 */

import { Message, ModelParameters } from '../../types/common';

// OpenAI API响应类型
export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
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

// OpenAI流式响应类型
export interface OpenAIStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
      function_call?: {
        name?: string;
        arguments?: string;
      };
    };
    finish_reason: string | null;
  }[];
}

// OpenAI错误响应类型
export interface OpenAIError {
  error: {
    message: string;
    type: string;
    param: string | null;
    code: string;
  };
}

// OpenAI特定配置
export interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  baseURL?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
}

// OpenAI请求参数
export interface OpenAIRequestParams {
  model: string;
  messages: Message[];
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
}

// OpenAI模型信息
export interface OpenAIModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  permission: any[];
  root: string;
  parent: string | null;
}

// 参数转换接口
export interface OpenAIParamsConverter {
  toOpenAIParams(params: ModelParameters): Partial<OpenAIRequestParams>;
  fromOpenAIResponse(response: OpenAIResponse): Message;
  fromOpenAIStreamResponse(response: OpenAIStreamResponse): Partial<Message>;
} 