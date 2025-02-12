import type { StateContainer as StateContainerType } from '../types';
import { StoreError, StoreErrorCode } from '../types';
import { IStateStorageAdapter } from '../adapters/StateStorageAdapter';
import { EventBus } from './EventBus';

/**
 * 状态容器接口
 */
export interface IStateContainer<T> {
  data: T;
  metadata: {
    version: string;
    lastUpdated: number;
    namespace: string;
  };
}

/**
 * 状态容器工厂类
 */
export class StateContainerFactory {
  /**
   * 创建状态容器
   * @param data 初始数据
   * @param namespace 命名空间
   * @param version 版本号
   */
  public static create<T>(
    data: T,
    namespace: string,
    version: string
  ): IStateContainer<T> {
    return {
      data,
      metadata: {
        version,
        lastUpdated: Date.now(),
        namespace
      }
    };
  }

  /**
   * 克隆状态容器
   * @param container 源状态容器
   */
  public static clone<T>(container: IStateContainer<T>): IStateContainer<T> {
    return {
      data: JSON.parse(JSON.stringify(container.data)),
      metadata: { ...container.metadata }
    };
  }

  /**
   * 更新状态容器
   * @param container 状态容器
   * @param data 新数据
   */
  public static update<T>(
    container: IStateContainer<T>,
    data: Partial<T>
  ): IStateContainer<T> {
    return {
      data: { ...container.data, ...data },
      metadata: {
        ...container.metadata,
        lastUpdated: Date.now()
      }
    };
  }

  /**
   * 验证状态容器
   * @param container 状态容器
   */
  public static validate<T>(container: unknown): container is IStateContainer<T> {
    if (!container || typeof container !== 'object') {
      return false;
    }

    const { data, metadata } = container as IStateContainer<T>;

    if (!data || typeof data !== 'object') {
      return false;
    }

    if (!metadata || typeof metadata !== 'object') {
      return false;
    }

    const { version, lastUpdated, namespace } = metadata;

    return (
      typeof version === 'string' &&
      typeof lastUpdated === 'number' &&
      typeof namespace === 'string'
    );
  }

  /**
   * 序列化状态容器
   * @param container 状态容器
   */
  public static serialize<T>(container: IStateContainer<T>): string {
    return JSON.stringify(container);
  }

  /**
   * 反序列化状态容器
   * @param data 序列化数据
   */
  public static deserialize<T>(data: string): IStateContainer<T> {
    const container = JSON.parse(data);
    if (!this.validate<T>(container)) {
      throw new Error('Invalid state container data');
    }
    return container;
  }
}

/**
 * 状态容器类
 */
export class StateContainer<T extends Record<string, any>> implements IStateContainer<T> {
  public data: T;
  public metadata: {
    version: string;
    lastUpdated: number;
    namespace: string;
  };
  private readonly initialState: T;
  private readonly eventBus: EventBus;
  private readonly storageAdapter: IStateStorageAdapter;

  constructor(
    initialState: T, 
    namespace: string,
    version: string,
    storageAdapter: IStateStorageAdapter
  ) {
    this.data = { ...initialState };
    this.initialState = initialState;
    this.metadata = {
      version,
      lastUpdated: Date.now(),
      namespace
    };
    this.eventBus = EventBus.getInstance();
    this.storageAdapter = storageAdapter;
  }

  /**
   * 获取当前状态
   */
  public getState(): T {
    return this.data;
  }

  /**
   * 更新状态
   */
  public setState(newState: Partial<T>): void {
    this.data = {
      ...this.data,
      ...newState,
    };
  }

  /**
   * 重置状态
   */
  public async resetState(): Promise<void> {
    this.data = { ...this.initialState };
    if (this.storageAdapter) {
      try {
        await this.storageAdapter.removeState(this.metadata.namespace);
      } catch (error) {
        this.eventBus.emitError(
          new StoreError(
            StoreErrorCode.RESET_FAILED,
            'Failed to reset state',
            error,
            this.metadata.namespace
          )
        );
      }
    }
  }

  /**
   * 持久化状态
   */
  public async persist(): Promise<void> {
    if (this.storageAdapter) {
      try {
        await this.storageAdapter.saveState(this.metadata.namespace, this.data);
      } catch (error) {
        this.eventBus.emitError(
          new StoreError(
            StoreErrorCode.PERSISTENCE_FAILED,
            'Failed to persist state',
            error,
            this.metadata.namespace
          )
        );
      }
    }
  }

  /**
   * 恢复状态
   */
  public async hydrate(): Promise<void> {
    if (this.storageAdapter) {
      try {
        const savedState = await this.storageAdapter.loadState<T>(this.metadata.namespace);
        if (savedState) {
          this.setState(savedState);
        }
      } catch (error) {
        this.eventBus.emitError(
          new StoreError(
            StoreErrorCode.HYDRATION_FAILED,
            'Failed to hydrate state',
            error,
            this.metadata.namespace
          )
        );
      }
    }
  }
} 