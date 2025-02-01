/**
 * 通义千问供应商类型定义
 */

import { Message, ModelParameters } from '../../types/common';

// 通义千问 API 响应类型
export interface AliyunResponse {
  request_id: string;
  output: {
    text: string;
    finish_reason: string;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

// 通义千问流式响应类型
export interface AliyunStreamResponse {
  request_id: string;
  output: {
    text: string;
    finish_reason?: string;
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

// 通义千问错误响应类型
export interface AliyunError {
  code: string;
  message: string;
  request_id: string;
}

// 通义千问特定配置
export interface AliyunConfig {
  apiKey: string;
  accessKeyId: string;
  accessKeySecret: string;
  baseURL: string;
  defaultModel: string;
  region: string;
  timeout?: number;
  maxRetries?: number;
}

// 通义千问请求参数
export interface AliyunRequestParams {
  model: string;
  input: {
    messages: {
      role: string;
      content: string;
    }[];
  };
  parameters?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    stop?: string[];
    result_format?: 'text' | 'message';
    stream?: boolean;
  };
}

// 阿里云认证参数
export interface AliyunAuthParams {
  method: string;
  path: string;
  headers: Record<string, string>;
  accessKeyId: string;
  accessKeySecret: string;
} 