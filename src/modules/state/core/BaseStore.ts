import { EventBus } from './EventBus';
import {
  StoreConfig,
  StateContainer,
  StoreErrorCode,
  ValidationOptions,
  StoreEvents
} from '../types';
import { StoreError } from '../types/error';
import { IStateStorageAdapter, PersistentStorageAdapter } from '../adapters/StateStorageAdapter';
import { EventEmitter } from 'events';
import { StateLogger } from '../utils';

const logger = StateLogger.getInstance();

type StateSubscriber<T> = (state: T) => void;

/**
 * 基础存储类
 */
export abstract class BaseStore<T extends Record<string, any>> extends EventEmitter {
  protected readonly namespace: string;
  protected readonly version: string;
  protected state: StateContainer<T>;
  protected readonly eventBus: EventBus;
  protected readonly config: StoreConfig;
  protected readonly transformer: { 
    toUnified: (state: Partial<T>) => Partial<T>; 
    fromUnified?: (state: T) => T;
    deepMerge: (target: any, source: any) => any;
  } = {
    toUnified: (state: Partial<T>) => state,
    fromUnified: (state: T) => state,
    deepMerge: (target: any, source: any) => ({ ...target, ...source })
  };
  private subscribers = new Set<StateSubscriber<T>>();
  private readonly storageAdapter: IStateStorageAdapter;

  constructor(
    config: StoreConfig,
    storageAdapter: IStateStorageAdapter = new PersistentStorageAdapter()
  ) {
    super();
    this.config = config;
    this.namespace = config.namespace;
    this.version = config.version;
    this.eventBus = EventBus.getInstance();
    this.storageAdapter = storageAdapter;
    this.state = this.createInitialState();
    logger.debug('BaseStore', `存储 ${this.namespace} 已创建`, {
      namespace: this.namespace,
      version: this.version
    });
  }

  /**
   * 创建初始状态
   */
  protected abstract createInitialState(): StateContainer<T>;

  /**
   * 验证状态
   * @param state 待验证的状态
   */
  protected abstract validateState(state: T): boolean;

  /**
   * 获取当前状态
   */
  public getState(): T {
    return this.state.data;
  }

  /**
   * 获取状态元数据
   */
  public getMetadata() {
    return this.state.metadata;
  }

  /**
   * 订阅状态变更
   * @param subscriber 订阅函数
   * @returns 取消订阅函数
   */
  public subscribe(subscriber: StateSubscriber<T>): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /**
   * 通知订阅者
   */
  protected notifySubscribers(): void {
    const subscriberCount = this.subscribers.size;
    logger.debug('BaseStore', `开始通知存储 ${this.namespace} 的订阅者`, {
      namespace: this.namespace,
      subscriberCount,
      state: this.state.data,
      timestamp: Date.now()
    });

    Array.from(this.subscribers).forEach((subscriber, index) => {
      try {
        subscriber(this.state.data);
        logger.debug('BaseStore', `成功通知存储 ${this.namespace} 的订阅者 ${index + 1}/${subscriberCount}`, {
          namespace: this.namespace,
          subscriberIndex: index,
          timestamp: Date.now()
        });
      } catch (error) {
        logger.error('BaseStore', `通知存储 ${this.namespace} 的订阅者 ${index + 1}/${subscriberCount} 失败`, error instanceof Error ? error : new Error('Unknown error'));
      }
    });

    logger.debug('BaseStore', `存储 ${this.namespace} 的订阅者通知完成`, {
      namespace: this.namespace,
      subscriberCount,
      timestamp: Date.now()
    });
  }

  /**
   * 更新状态
   */
  public setState(update: Partial<T>): void {
    logger.debug('BaseStore', `开始更新存储 ${this.namespace} 状态`, {
      namespace: this.namespace,
      oldState: this.state.data,
      update,
      timestamp: Date.now(),
      metadata: this.state.metadata
    });

    const oldState = { ...this.state.data };

    try {
      // 转换状态
      const unified = this.transformer.toUnified(update);
      
      // 使用 transformer 的 deepMerge 进行状态合并
      const mergedState = this.transformer.deepMerge(this.state.data, unified);
      
      // 验证合并后的状态
      if (this.validateState(mergedState)) {
        // 更新状态
        this.state.data = mergedState;
        this.state.metadata.lastUpdated = Date.now();

        logger.debug('BaseStore', `存储 ${this.namespace} 状态验证通过`, {
          namespace: this.namespace,
          newState: mergedState,
          timestamp: this.state.metadata.lastUpdated
        });

        // 触发事件
        this.eventBus.emitStateChanged({
          namespace: this.namespace,
          newState: mergedState,
          oldState,
          timestamp: this.state.metadata.lastUpdated
        });

        // 通知订阅者
        this.notifySubscribers();

        // 处理持久化
        if (this.config.persistence?.enabled) {
          logger.debug('BaseStore', `触发存储 ${this.namespace} 持久化`, {
            namespace: this.namespace,
            state: mergedState,
            timestamp: Date.now()
          });
          
          this.persist().catch(error => {
            logger.error('BaseStore', `存储 ${this.namespace} 持久化失败`, error instanceof Error ? error : new Error('Unknown error'));
            this.eventBus.emitError(new StoreError(
              StoreErrorCode.PERSISTENCE_FAILED,
              'Failed to persist state',
              error,
              this.namespace
            ));
          });
        }
      } else {
        throw new Error('State validation failed');
      }
    } catch (error) {
      const validationError = new StoreError(
        StoreErrorCode.VALIDATION_FAILED,
        'State validation failed',
        { oldState, update, error },
        this.namespace
      );
      logger.error('BaseStore', `存储 ${this.namespace} 状态验证失败`, validationError);
      throw validationError;
    }
  }

  /**
   * 重置状态
   */
  public async resetState(): Promise<void> {
    const initialState = this.createInitialState();
    this.setState(initialState.data);
    if (this.config.persistence?.enabled) {
      await this.storageAdapter.removeState(this.namespace);
    }
  }

  /**
   * 持久化状态
   */
  public async persist(): Promise<void> {
    if (!this.config.persistence?.enabled) {
      logger.debug('BaseStore', `存储 ${this.namespace} 未启用持久化`);
      return;
    }

    try {
      const currentState = this.getState();
      
      logger.debug('BaseStore', `开始持久化存储 ${this.namespace}`, {
        namespace: this.namespace,
        state: currentState,
        timestamp: Date.now()
      });
      
      // 直接保存当前状态，不进行额外的转换
      await this.storageAdapter.saveState(this.namespace, currentState);
      this.eventBus.emitPersistCompleted(this.namespace);
      
      logger.debug('BaseStore', `存储 ${this.namespace} 持久化完成`, {
        savedState: currentState,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error('BaseStore', `存储 ${this.namespace} 持久化失败`, error instanceof Error ? error : new Error('Unknown error'));
      throw new StoreError(
        StoreErrorCode.PERSISTENCE_FAILED,
        'Failed to persist state',
        error,
        this.namespace
      );
    }
  }

  /**
   * 恢复状态
   */
  public async hydrate(): Promise<void> {
    if (!this.config.persistence?.enabled) {
      logger.debug('BaseStore', `存储 ${this.namespace} 未启用持久化，跳过恢复`);
      return;
    }

    try {
      logger.debug('BaseStore', `开始恢复存储 ${this.namespace} 状态`);
      
      const savedState = await this.storageAdapter.loadState<T>(this.namespace);
      if (savedState && this.validateState(savedState)) {
        this.setState(savedState);
        this.eventBus.emitHydrateCompleted(this.namespace);
        logger.debug('BaseStore', `存储 ${this.namespace} 状态恢复完成`);
      } else {
        logger.debug('BaseStore', `存储 ${this.namespace} 无有效的已保存状态`);
      }
    } catch (error) {
      logger.error('BaseStore', `存储 ${this.namespace} 状态恢复失败`, error instanceof Error ? error : new Error('Unknown error'));
      throw new StoreError(
        StoreErrorCode.HYDRATION_FAILED,
        'Failed to hydrate state',
        error,
        this.namespace
      );
    }
  }

  /**
   * 初始化存储
   */
  public async initialize(): Promise<void> {
    logger.debug('BaseStore', `开始初始化存储 ${this.namespace}`, {
      namespace: this.namespace,
      version: this.version
    });

    try {
      // 如果启用了持久化，尝试恢复状态
      if (this.config.persistence?.enabled) {
        await this.hydrate();
      }

      // 触发初始化完成事件
      this.eventBus.emit(StoreEvents.STORE_INITIALIZED, {
        namespace: this.namespace,
        version: this.version,
        timestamp: Date.now()
      });

      logger.debug('BaseStore', `存储 ${this.namespace} 初始化完成`);
    } catch (error) {
      logger.error('BaseStore', `存储 ${this.namespace} 初始化失败`, error instanceof Error ? error : new Error('Unknown error'));
      throw new StoreError(
        StoreErrorCode.INITIALIZATION_FAILED,
        `Failed to initialize store ${this.namespace}`,
        error,
        this.namespace
      );
    }
  }

  public emit(event: string, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }
}