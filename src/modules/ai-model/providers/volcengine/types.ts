/**
 * 火山引擎供应商类型定义
 */

import { Message, ModelParameters } from '../../types/common';

// 火山引擎 API 响应类型
export interface VolcengineResponse {
  request_id: string;
  code: number;
  message: string;
  data: {
    output: {
      text: string;
      tokens: number;
    };
    usage: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    };
    request_id: string;
  };
}

// 火山引擎流式响应类型
export interface VolcengineStreamResponse {
  request_id: string;
  code: number;
  message: string;
  data: {
    output: {
      text: string;
      tokens: number;
    };
    is_end: boolean;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    };
  };
}

// 火山引擎错误响应类型
export interface VolcengineError {
  code: number;
  message: string;
  request_id: string;
}

// 火山引擎特定配置
export interface VolcengineConfig {
  apiKey: string;
  secretKey: string;
  baseURL: string;
  defaultModel: string;
  region: string;
  projectId: string;
  timeout?: number;
  maxRetries?: number;
}

// 火山引擎请求参数
export interface VolcengineRequestParams {
  model: {
    name: string;
  };
  parameters: {
    max_new_tokens?: number;
    temperature?: number;
    top_p?: number;
    stream?: boolean;
  };
  messages: {
    role: string;
    content: string;
  }[];
  system?: string;
} 