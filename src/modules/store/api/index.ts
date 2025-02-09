import { EventBus } from '@core/events/EventBus';

export interface StateManager {
  getState<T>(namespace: string): T;
  setState<T>(namespace: string, state: T): void;
}

export class ModuleStore<T> {
  private static stateManager: StateManager;
  private static eventBus: EventBus;
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
    
    if (!ModuleStore.eventBus) {
      ModuleStore.eventBus = EventBus.getInstance();
    }
  }

  static setStateManager(manager: StateManager): void {
    ModuleStore.stateManager = manager;
  }

  getState(): T {
    if (!ModuleStore.stateManager) {
      throw new Error('StateManager not initialized');
    }
    return ModuleStore.stateManager.getState<T>(this.namespace);
  }

  setState(state: T): void {
    if (!ModuleStore.stateManager) {
      throw new Error('StateManager not initialized');
    }
    ModuleStore.stateManager.setState(this.namespace, state);
    ModuleStore.eventBus.emit(`${this.namespace}:state_changed`, state);
  }

  subscribe(listener: (state: T) => void): () => void {
    const eventName = `${this.namespace}:state_changed`;
    ModuleStore.eventBus.on(eventName, listener);
    return () => ModuleStore.eventBus.off(eventName, listener);
  }
} 