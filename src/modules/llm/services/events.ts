import { LLMEvents } from '../api/events';
import type { StoreEvents } from '../../state/types/store';
import type { LLMState } from '../../state/types/llm';
import type { ChatResponse } from '../api/types';
import type { LLMError } from '../types/error';

export type EventType = LLMEvents | StoreEvents;

export interface IEventEmitter {
  emit<T>(event: EventType, data: T): void;
  on(event: EventType, handler: (data: any) => void): void;
  off(event: EventType, handler: (data: any) => void): void;
}

export class ModuleEventBus implements IEventEmitter {
  private handlers = new Map<EventType, Set<(data: any) => void>>();

  emit<T>(event: EventType, data: T): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  on(event: EventType, handler: (data: any) => void): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: EventType, handler: (data: any) => void): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(event);
      }
    }
  }
}

export const moduleEventBus = new ModuleEventBus(); 