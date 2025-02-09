import type { ChatResponse, ServiceStatus } from './types';
import type { LLMError } from '../types/error';
import type { IEventEmitter } from '../services/events';

export enum LLMEvents {
  RESPONSE_RECEIVED = 'llm:response_received',
  ERROR_OCCURRED = 'llm:error_occurred',
  STATUS_CHANGED = 'llm:status_changed',
  MODEL_CHANGED = 'llm:model_changed'
}

export interface LLMEventPayloads {
  [LLMEvents.RESPONSE_RECEIVED]: ChatResponse;
  [LLMEvents.ERROR_OCCURRED]: LLMError;
  [LLMEvents.STATUS_CHANGED]: ServiceStatus;
  [LLMEvents.MODEL_CHANGED]: string;
}

export const registerLLMEvents = (eventBus: IEventEmitter) => {
  const handlers: Partial<{
    [K in LLMEvents]: (data: LLMEventPayloads[K]) => void;
  }> = {
    [LLMEvents.RESPONSE_RECEIVED]: (response) => {
      console.log('LLM Response:', response);
    },
    [LLMEvents.ERROR_OCCURRED]: (error) => {
      console.error('LLM Error:', error);
    },
    [LLMEvents.STATUS_CHANGED]: (status) => {
      console.log('LLM Status Changed:', status);
    },
    [LLMEvents.MODEL_CHANGED]: (modelId) => {
      console.log('LLM Model Changed:', modelId);
    },
  };

  // 注册所有事件处理器
  Object.entries(handlers).forEach(([event, handler]) => {
    eventBus.on(event, handler);
  });
};
