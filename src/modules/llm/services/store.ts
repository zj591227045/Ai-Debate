import type { LLMProvider } from './provider/base';
import { moduleEventBus } from './events';

export interface LLMState {
  currentModelId: string;
  providers: Map<string, LLMProvider>;
  isReady: boolean;
  error?: string;
}

export interface IStateStore<T> {
  getState(): T;
  setState(state: Partial<T>): void;
  subscribe(listener: (state: T) => void): () => void;
}

export class ModuleStore implements IStateStore<LLMState> {
  private state: LLMState = {
    currentModelId: '',
    providers: new Map(),
    isReady: false
  };

  getState(): LLMState {
    return this.state;
  }

  setState(update: Partial<LLMState>): void {
    this.state = { ...this.state, ...update };
    moduleEventBus.emit('state:updated', this.state);
  }

  subscribe(listener: (state: LLMState) => void): () => void {
    const handler = (state: LLMState) => listener(state);
    moduleEventBus.on('state:updated', handler);
    return () => moduleEventBus.off('state:updated', handler);
  }
}

export const moduleStore = new ModuleStore(); 