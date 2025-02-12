import { StoreEvents, StateChangePayload, StoreError } from '../types';

type EventHandler = (payload: any) => void;

/**
 * 事件总线类
 */
export class EventBus {
  private static instance: EventBus;
  private handlers: Map<StoreEvents, Set<EventHandler>>;

  private constructor() {
    this.handlers = new Map();
  }

  /**
   * 获取事件总线实例
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * 订阅事件
   * @param event 事件类型
   * @param handler 事件处理器
   * @returns 取消订阅函数
   */
  public on(event: StoreEvents, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    return () => {
      this.off(event, handler);
    };
  }

  /**
   * 取消事件订阅
   * @param event 事件类型
   * @param handler 事件处理器
   */
  public off(event: StoreEvents, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 触发事件
   * @param event 事件类型
   * @param payload 事件载荷
   */
  public emit(event: StoreEvents, payload: any): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * 触发状态变更事件
   * @param payload 状态变更载荷
   */
  public emitStateChanged(payload: StateChangePayload): void {
    this.emit(StoreEvents.STATE_CHANGED, payload);
  }

  /**
   * 触发错误事件
   * @param error 错误对象
   */
  public emitError(error: StoreError): void {
    this.emit(StoreEvents.ERROR_OCCURRED, error);
  }

  /**
   * 触发持久化完成事件
   * @param namespace 命名空间
   */
  public emitPersistCompleted(namespace: string): void {
    this.emit(StoreEvents.PERSIST_COMPLETED, { namespace });
  }

  /**
   * 触发恢复完成事件
   * @param namespace 命名空间
   */
  public emitHydrateCompleted(namespace: string): void {
    this.emit(StoreEvents.HYDRATE_COMPLETED, { namespace });
  }
} 