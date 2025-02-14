// LLM Service API 类型定义
import type {
  GenerateStreamOptions,
  GenerateStreamResponse,
  ChatOptions,
} from '../types/api';

export type {
  GenerateStreamOptions,
  GenerateStreamResponse,
  ChatOptions,
};

export interface ChatRequest {
  message: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  model?: string;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  metadata: {
    modelId: string;
    provider: string;
    timestamp: number;
    tokensUsed?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
}

export interface ResponseMetadata {
  modelId: string;
  provider: string;
  timestamp: number;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface ServiceStatus {
  isReady: boolean;
  currentModel: string;
  provider: string;
  error?: string;
}

export interface TestConfig {
  message?: string;
  timeout?: number;
}

export interface TestResult {
  success: boolean;
  latency: number;
  error?: string;
}

export interface LLMServiceAPI {
  initialize(): Promise<void>;
  chat(request: ChatRequest): Promise<ChatResponse>;
  stream(request: ChatRequest): AsyncGenerator<ChatResponse>;
  setModel(modelId: string): Promise<void>;
  getModel(): string;
  getStatus(): ServiceStatus;
  test(config?: TestConfig): Promise<TestResult>;
}
