/**
 * Ollama供应商类型定义
 */

import { Message, ModelParameters, ModelError } from '../../types/common';

// Ollama API 响应类型
export interface OllamaResponse {
  model: string;
  message?: {
    role: string;
    content: string;
  };
  response?: string;
  done: boolean;
  prompt_eval_count: number;
  eval_count: number;
  total_duration: number;
}

// Ollama 流式响应类型
export interface OllamaStreamResponse extends OllamaResponse {
  model: string;
  message?: {
    role: string;
    content: string;
  };
  response?: string;
  done: boolean;
  prompt_eval_count: number;
  eval_count: number;
}

// Ollama 错误响应类型
export interface OllamaError {
  error: string;
  code?: string;
  status?: number;
  type?: string;
}

// Ollama 配置
export interface OllamaConfig {
  baseURL: string;
  defaultModel: string;
  timeout: number;
  maxRetries: number;
  options?: Record<string, any>;
}

// Ollama 特定配置
export interface OllamaProviderSpecific {
  baseUrl?: string;  // Ollama服务器地址
  model: string;    // 默认模型
  options?: {
    temperature?: number;
    top_p?: number;
    repeat_penalty?: number;
    stop?: string[];
    num_predict?: number;
    [key: string]: any;
  };
}

// Ollama 请求参数
export interface OllamaRequestParams {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    repeat_penalty?: number;
    stop?: string[];
    num_predict?: number;
    [key: string]: any;
  };
}

export interface OllamaMessage {
  role: string;
  content: string;
} 