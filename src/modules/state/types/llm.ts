import type { LLMProvider } from '../../llm/services/provider/base';
import type { ChatResponse } from '../../llm/api/types';
import type { LLMError } from '../../llm/types/error';

/**
 * LLM状态接口
 */
export interface LLMState {
  /** 当前使用的模型ID */
  currentModelId: string;
  /** 可用的LLM提供商映射 */
  providers: Map<string, LLMProvider>;
  /** 服务是否就绪 */
  isReady: boolean;
  /** 错误信息 */
  error?: string;
  /** 模型配置 */
  config?: {
    /** 模型温度 */
    temperature: number;
    /** 最大token数 */
    maxTokens: number;
    /** 是否启用流式响应 */
    streamingEnabled: boolean;
  };
}

/**
 * LLM服务状态
 */
export interface ServiceStatus {
  /** 服务是否就绪 */
  isReady: boolean;
  /** 当前使用的模型 */
  currentModel: string;
  /** 当前使用的提供商 */
  provider: string;
  /** 错误信息 */
  error?: string;
}

/**
 * LLM事件类型
 */
export enum LLMEvents {
  /** 收到响应 */
  RESPONSE_RECEIVED = 'llm:response_received',
  /** 发生错误 */
  ERROR_OCCURRED = 'llm:error_occurred',
  /** 状态变更 */
  STATUS_CHANGED = 'llm:status_changed',
  /** 模型变更 */
  MODEL_CHANGED = 'llm:model_changed'
}

/**
 * LLM事件处理器
 */
export interface LLMEventHandlers {
  onResponseReceived: (response: ChatResponse) => void;
  onErrorOccurred: (error: LLMError) => void;
  onStatusChanged: (status: ServiceStatus) => void;
  onModelChanged: (modelId: string) => void;
} 