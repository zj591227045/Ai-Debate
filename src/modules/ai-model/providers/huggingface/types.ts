/**
 * Hugging Face供应商类型定义
 */

import { Message, ModelParameters, ModelError } from '../../types/common';

// Hugging Face API 响应类型
export interface HuggingFaceResponse {
  generated_text: string;
  details?: {
    finish_reason: string;
    generated_tokens: number;
    seed?: number;
    prefill?: any[];
    tokens?: any[];
  };
}

// Hugging Face 流式响应类型
export interface HuggingFaceStreamResponse {
  token: {
    text: string;
    logprob: number;
    id: number;
  };
  generated_text?: string;
  details?: {
    finish_reason: string;
    generated_tokens: number;
  };
}

// Hugging Face 错误响应类型
export interface HuggingFaceError {
  error: string;
  error_type?: string;
  warnings?: string[];
  estimated_time?: number;
}

// Hugging Face 配置
export interface HuggingFaceConfig {
  apiKey: string;
  baseURL: string;
  defaultModel: string;
  timeout?: number;
  maxRetries?: number;
  waitForModel?: boolean;
  useCache?: boolean;
}

// Hugging Face 请求参数
export interface HuggingFaceRequestParams {
  inputs: string;
  parameters?: {
    max_new_tokens?: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repetition_penalty?: number;
    do_sample?: boolean;
    seed?: number;
    stop?: string[];
    return_full_text?: boolean;
  };
  options?: {
    wait_for_model?: boolean;
    use_cache?: boolean;
  };
}