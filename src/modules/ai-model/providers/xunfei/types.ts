/**
 * 讯飞星火供应商类型定义
 */

import { Message, ModelParameters } from '../../types/common';

// 讯飞星火 API 响应类型
export interface XunfeiResponse {
  header: {
    code: number;
    message: string;
    sid: string;
    status: number;
  };
  payload: {
    choices: {
      status: number;
      seq: number;
      text: {
        content: string;
        role: string;
        index: number;
      }[];
    }[];
    usage?: {
      text: {
        question_tokens: number;
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };
  };
}

// 讯飞星火流式响应类型
export interface XunfeiStreamResponse {
  header: {
    code: number;
    message: string;
    sid: string;
    status: number;
  };
  payload: {
    choices: {
      status: number;
      seq: number;
      text: {
        content: string;
        role: string;
        index: number;
      }[];
    }[];
  };
}

// 讯飞星火错误响应类型
export interface XunfeiError {
  header: {
    code: number;
    message: string;
    sid: string;
    status: number;
  };
}

// 讯飞星火特定配置
export interface XunfeiConfig {
  apiKey: string;
  appId: string;
  apiSecret: string;
  baseURL: string;
  defaultModel: string;
  timeout?: number;
  maxRetries?: number;
}

// 讯飞星火请求参数
export interface XunfeiRequestParams {
  header: {
    app_id: string;
    uid?: string;
  };
  parameter: {
    chat: {
      domain: string;
      temperature?: number;
      top_k?: number;
      max_tokens?: number;
      auditing?: 'default' | 'strict';
    };
  };
  payload: {
    message: {
      text: {
        role: string;
        content: string;
      }[];
    };
  };
}

// 讯飞星火认证参数
export interface XunfeiAuthParams {
  host: string;
  path: string;
  apiKey: string;
  apiSecret: string;
} 