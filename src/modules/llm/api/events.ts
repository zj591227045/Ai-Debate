import type { IEventEmitter } from '../services/events';
import type { ChatResponse } from './types';
import type { LLMError } from '../types/error';
import type { ServiceStatus } from '../../state/types/llm';

export enum LLMEvents {
  RESPONSE_RECEIVED = 'llm:response_received',
  ERROR_OCCURRED = 'llm:error_occurred',
  STATUS_CHANGED = 'llm:status_changed',
  MODEL_CHANGED = 'llm:model_changed'
}

export interface LLMEventHandlers {
  [LLMEvents.RESPONSE_RECEIVED]: (response: ChatResponse) => void;
  [LLMEvents.ERROR_OCCURRED]: (error: LLMError) => void;
  [LLMEvents.STATUS_CHANGED]: (status: ServiceStatus) => void;
  [LLMEvents.MODEL_CHANGED]: (modelId: string) => void;
}

export const registerEventHandlers = (
  eventBus: IEventEmitter,
  handlers: Partial<LLMEventHandlers>
): void => {
  // 注册所有事件处理器
  Object.entries(handlers).forEach(([event, handler]) => {
    eventBus.on(event as LLMEvents, handler);
  });
};
