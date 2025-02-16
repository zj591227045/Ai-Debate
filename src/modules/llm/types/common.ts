/**
 * 通用消息类型定义
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning_content?: string;
  timestamp?: number;
}

/**
 * 流式响应类型
 */
export interface StreamResponse {
  content: string;
  isError?: boolean;
  metadata?: Record<string, any>;
}

export interface ModelCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  maxContextTokens: number;
  maxResponseTokens: number;
  multipleCompletions: boolean;
}

export interface ProviderCapabilities extends ModelCapabilities {
  supportedModels: string[];
  supportedParameters: {
    temperature?: boolean;
    topP?: boolean;
    maxTokens?: boolean;
    presencePenalty?: boolean;
    frequencyPenalty?: boolean;
    stop?: boolean;
  };
} 