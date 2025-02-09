export type EventMap = {
  [key: string]: unknown;
};

export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, Set<(data: unknown) => void>>;

  private constructor() {
    this.handlers = new Map();
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on<T>(event: string, handler: (data: T) => void): void {
    const handlers = this.handlers.get(event) || new Set();
    this.handlers.set(event, handlers);
    handlers.add(handler as (data: unknown) => void);
  }

  off<T>(event: string, handler: (data: T) => void): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler as (data: unknown) => void);
      if (handlers.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  emit<T>(event: string, data: T): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  clear(): void {
    this.handlers.clear();
  }

  // 用于调试
  getEventNames(): string[] {
    return Array.from(this.handlers.keys());
  }

  getHandlerCount(event: string): number {
    return this.handlers.get(event)?.size || 0;
  }
} 