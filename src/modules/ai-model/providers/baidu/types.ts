/**
 * 文心一言供应商类型定义
 */

import { Message, ModelParameters } from '../../types/common';

// 文心一言 API 响应类型
export interface BaiduResponse {
  id: string;
  object: string;
  created: number;
  sentence_id: number;
  is_end: boolean;
  is_truncated: boolean;
  result: string;
  need_clear_history: boolean;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 文心一言流式响应类型
export interface BaiduStreamResponse {
  id: string;
  object: string;
  created: number;
  sentence_id: number;
  is_end: boolean;
  is_truncated: boolean;
  result: string;
  need_clear_history: boolean;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 文心一言错误响应类型
export interface BaiduError {
  error_code: number;
  error_msg: string;
}

// 文心一言特定配置
export interface BaiduConfig {
  apiKey: string;
  secretKey: string;
  baseURL: string;
  defaultModel: string;
  timeout?: number;
  maxRetries?: number;
  accessToken?: string;
  accessTokenExpireTime?: number;
}

// 文心一言请求参数
export interface BaiduRequestParams {
  messages: {
    role: string;
    content: string;
  }[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  penalty_score?: number;
  user_id?: string;
  system?: string;
}

// 文心一言认证响应
export interface BaiduAuthResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  session_key: string;
  session_secret: string;
} 