/**
 * Ollama供应商类型定义
 */

import { Message, ModelParameters, ModelError } from '../../types/common';

// Ollama API 响应类型
export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
}

// Ollama 流式响应类型
export interface OllamaStreamResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

// Ollama 错误响应类型
export interface OllamaError {
  error: string;
  code?: string;
  type?: ModelError['type'];
  retryable?: boolean;
}

// Ollama 配置
export interface OllamaConfig {
  baseURL: string;
  defaultModel: string;
  timeout?: number;
  maxRetries?: number;
  context?: number[];
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    seed?: number;
    num_predict?: number;
    stop?: string[];
    num_ctx?: number;
  };
}

// Ollama 请求参数
export interface OllamaRequestParams {
  model: string;
  prompt: string;
  stream?: boolean;
  context?: number[];
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    seed?: number;
    num_predict?: number;
    stop?: string[];
    num_ctx?: number;
  };
} 