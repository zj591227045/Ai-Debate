import type { IEventEmitter } from './events';
import type { IStateStore, LLMState } from './store';
import { UnifiedLLMService } from './UnifiedLLMService';

export interface Container {
  eventBus: IEventEmitter;
  store: IStateStore<LLMState>;
  llmService: UnifiedLLMService;
}

let container: Container | null = null;

export function initializeContainer(
  eventBus: IEventEmitter,
  store: IStateStore<LLMState>
): Container {
  if (!container) {
    const llmService = UnifiedLLMService.getInstance();
    container = {
      eventBus,
      store,
      llmService
    };
  }
  return container;
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