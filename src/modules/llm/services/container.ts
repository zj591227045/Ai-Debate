import type { IEventEmitter } from './events';
import { UnifiedLLMService } from './UnifiedLLMService';
import { StoreManager } from '../../state/core/StoreManager';
import type { LLMState } from '../../state/types/llm';
import { LLMEvents } from '../api/events';
import type { LLMEventHandlers } from '../api/events';
import { LLMStore } from '../../state/stores/LLMStore';

export interface Container {
  eventBus: IEventEmitter;
  llmService: UnifiedLLMService;
}

let container: Container | null = null;

export async function initializeContainer(eventBus: IEventEmitter): Promise<void> {
  const storeManager = StoreManager.getInstance();
  const llmStore = storeManager.getStore<LLMStore>('llm');
  const llmService = UnifiedLLMService.getInstance();
  
  container = {
    eventBus,
    llmService
  };

  // 初始化事件监听
  const handlers: Partial<LLMEventHandlers> = {
    [LLMEvents.STATUS_CHANGED]: (status) => {
      llmStore.setState({ ...status });
    }
  };

  Object.entries(handlers).forEach(([event, handler]) => {
    eventBus.on(event as LLMEvents, handler);
  });
}

export function getContainer(): Container {
  if (!container) {
    throw new Error('容器未初始化');
  }
  return container;
}

export function getLLMService(): UnifiedLLMService {
  return getContainer().llmService;
}