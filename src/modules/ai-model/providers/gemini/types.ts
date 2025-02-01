/**
 * Gemini供应商类型定义
 */

import { Message, ModelParameters } from '../../types/common';

// 安全类别
export type SafetyCategory =
  | 'HARM_CATEGORY_HARASSMENT'
  | 'HARM_CATEGORY_HATE_SPEECH'
  | 'HARM_CATEGORY_SEXUALLY_EXPLICIT'
  | 'HARM_CATEGORY_DANGEROUS_CONTENT';

// 安全阈值
export type SafetyThreshold =
  | 'BLOCK_NONE'
  | 'BLOCK_LOW_AND_ABOVE'
  | 'BLOCK_MEDIUM_AND_ABOVE'
  | 'BLOCK_HIGH_AND_ABOVE';

// Gemini API 响应类型
export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings: {
      category: SafetyCategory;
      probability: string;
    }[];
  }[];
  promptFeedback: {
    safetyRatings: {
      category: SafetyCategory;
      probability: string;
    }[];
  };
}

// Gemini 流式响应类型
export interface GeminiStreamResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
      role: string;
    };
    finishReason?: string;
    index: number;
    safetyRatings?: {
      category: SafetyCategory;
      probability: string;
    }[];
  }[];
}

// Gemini 错误响应类型
export interface GeminiError {
  error: {
    code: number;
    message: string;
    status: string;
    details?: any[];
  };
}

// Gemini 特定配置
export interface GeminiConfig {
  apiKey: string;
  baseURL: string;
  defaultModel: string;
  timeout?: number;
  maxRetries?: number;
  safetySettings?: {
    category: SafetyCategory;
    threshold: SafetyThreshold;
  }[];
}

// Gemini 请求参数
export interface GeminiRequestParams {
  contents: {
    parts: {
      text: string;
    }[];
    role?: string;
  }[];
  safetySettings?: {
    category: SafetyCategory;
    threshold: SafetyThreshold;
  }[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
    candidateCount?: number;
  };
} 
