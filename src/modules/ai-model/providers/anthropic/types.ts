/**
 * Anthropic供应商类型定义
 */

import { Message, ModelParameters } from '../../types/common';

// Anthropic API响应类型
export interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: string;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Anthropic流式响应类型
export interface AnthropicStreamResponse {
  type: string;
  delta: {
    text: string;
  };
  stop_reason?: string;
}

// Anthropic错误响应类型
export interface AnthropicError {
  type: string;
  message: string;
  status_code?: number;
}

// Anthropic特定配置
export interface AnthropicConfig {
  apiKey: string;
  baseURL: string;
  defaultModel: string;
  timeout?: number;
  maxRetries?: number;
  version?: string;
}

// Anthropic请求参数
export interface AnthropicRequestParams {
  model: string;
  messages: {
    role: string;
    content: string;
  }[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
  stream?: boolean;
  system?: string;
} 