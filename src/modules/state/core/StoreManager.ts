import { BaseStore } from './BaseStore';
import { EventBus } from './EventBus';
import { StoreErrorCode, UnifiedState } from '../types';
import { StoreError } from '../types/error';
import { IStateStorageAdapter, PersistentStorageAdapter } from '../adapters/StateStorageAdapter';
import { ModelStore } from '../stores/ModelStore';
import { StateLogger } from '../utils';
import { LLMStore } from '../stores/LLMStore';

const logger = StateLogger.getInstance();

type StoreSubscriber = () => void;

/**
 * 存储管理器类
 */
export class StoreManager {
  private static instance: StoreManager;
  private stores: Map<string, BaseStore<any>>;
  private readonly eventBus: EventBus;
  private subscribers = new Set<StoreSubscriber>();
  private readonly storageAdapter: IStateStorageAdapter;
  private isInitialized: boolean = false;

  private constructor(storageAdapter: IStateStorageAdapter = new PersistentStorageAdapter()) {
    this.stores = new Map();
    this.eventBus = EventBus.getInstance();
    this.storageAdapter = storageAdapter;
    this.initializeStores();
    logger.debug('StoreManager', '存储管理器实例已创建');
  }

  private initializeStores(): void {
    // 初始化所有store
    this.stores.set('llm', new LLMStore());
  }

  /**
   * 获取存储管理器实例
   */
  public static getInstance(): StoreManager {
    if (!StoreManager.instance) {
      StoreManager.instance = new StoreManager();
      logger.debug('StoreManager', '创建新的存储管理器实例');
    }
    return StoreManager.instance;
  }

  /**
   * 检查初始化状态
   */
  public isStoreInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 订阅状态变更
   * @param subscriber 订阅函数
   * @returns 取消订阅函数
   */
  public subscribe(subscriber: StoreSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(): void {
    const unifiedState = this.getUnifiedState();
    const subscriberCount = this.subscribers.size;
    
    logger.debug('StoreManager', '开始通知订阅者状态更新', {
      subscriberCount,
      stores: Array.from(this.stores.keys()),
      unifiedState
    });
    
    Array.from(this.subscribers).forEach((subscriber, index) => {
      try {
        subscriber();
        logger.debug('StoreManager', `成功通知订阅者 ${index + 1}/${subscriberCount}`, {
          subscriberIndex: index,
          timestamp: Date.now()
        });
      } catch (error) {
        logger.error('StoreManager', `通知订阅者 ${index + 1}/${subscriberCount} 失败`, error instanceof Error ? error : new Error('Unknown error'));
      }
    });
    
    logger.debug('StoreManager', '状态更新通知完成', {
      subscriberCount,
      finalState: unifiedState,
      timestamp: Date.now()
    });
  }

  /**
   * 注册存储实例
   * @param store 存储实例
   */
  public registerStore<T extends Record<string, any>>(store: BaseStore<T>): void {
    const namespace = store.getMetadata().namespace;
    logger.debug('StoreManager', `注册存储: ${namespace}`, {
      namespace,
      version: store.getMetadata().version
    });
    
    // 如果已经存在同名的 store，检查是否相同版本
    if (this.stores.has(namespace)) {
      const existingStore = this.stores.get(namespace);
      const existingVersion = existingStore?.getMetadata().version;
      const newVersion = store.getMetadata().version;
      
      // 如果是相同版本的 store，直接返回
      if (existingVersion === newVersion) {
        logger.debug('StoreManager', `存储 ${namespace} 已存在且版本相同，跳过注册`);
        return;
      }
      
      // 如果是不同版本，抛出错误
      logger.error('StoreManager', `存储 ${namespace} 已存在但版本不同`, new StoreError(
        StoreErrorCode.NAMESPACE_CONFLICT,
        `Store with namespace "${namespace}" already exists with different version`,
        { namespace, existingVersion, newVersion },
        namespace
      ));
    }
    
    // 监听存储变更
    store.subscribe(() => {
      logger.debug('StoreManager', `存储 ${namespace} 状态已更新`);
      this.notifySubscribers();
    });
    
    this.stores.set(namespace, store);
    logger.debug('StoreManager', `存储 ${namespace} 注册成功`);
  }

  /**
   * 获取存储实例
   * @param namespace 命名空间
   */
  public getStore<T extends Record<string, any>>(namespace: string): BaseStore<T> {
    logger.debug('StoreManager', `获取存储: ${namespace}`);
    
    if (!this.isInitialized) {
      logger.error('StoreManager', '存储管理器尚未初始化');
      throw new StoreError(
        StoreErrorCode.INITIALIZATION_FAILED,
        'Store manager is not initialized yet',
        { namespace },
        namespace
      );
    }

    const store = this.stores.get(namespace);
    if (!store) {
      logger.error('StoreManager', `未找到存储: ${namespace}`);
      throw new StoreError(
        StoreErrorCode.STORE_NOT_FOUND,
        `Store with namespace "${namespace}" not found`,
        { namespace },
        namespace
      );
    }
    return store as BaseStore<T>;
  }

  /**
   * 获取统一状态
   */
  public getUnifiedState(): UnifiedState {
    logger.debug('StoreManager', '获取统一状态');
    const state: Partial<UnifiedState> = {};
    this.stores.forEach((store, namespace) => {
      state[namespace as keyof UnifiedState] = store.getState();
    });
    return state as UnifiedState;
  }

  /**
   * 更新统一状态
   */
  public updateUnifiedState(update: Partial<UnifiedState>): void {
    logger.debug('StoreManager', '开始更新统一状态', {
      currentState: this.getUnifiedState(),
      update,
      timestamp: Date.now()
    });

    Object.entries(update).forEach(([namespace, value]) => {
      try {
        const store = this.getStore(namespace);
        store.setState(value);
        logger.debug('StoreManager', `成功更新存储 ${namespace}`, {
          namespace,
          newValue: value,
          timestamp: Date.now()
        });
      } catch (error) {
        logger.error('StoreManager', `更新存储 ${namespace} 失败`, error instanceof Error ? error : new Error('Unknown error'));
      }
    });

    this.notifySubscribers();
    
    logger.debug('StoreManager', '统一状态更新完成', {
      finalState: this.getUnifiedState(),
      timestamp: Date.now()
    });
  }

  /**
   * 持久化所有状态
   */
  public async persistAll(): Promise<void> {
    const promises = Array.from(this.stores.values()).map(store => 
      store.persist().catch(error => {
        this.eventBus.emitError(
          new StoreError(
            StoreErrorCode.PERSISTENCE_FAILED,
            'Failed to persist store state',
            error,
            store.getMetadata().namespace
          )
        );
      })
    );
    await Promise.all(promises);
  }

  /**
   * 恢复所有状态
   */
  public async hydrateAll(): Promise<void> {
    logger.debug('StoreManager', '开始恢复所有状态');
    const promises = Array.from(this.stores.values()).map(store =>
      store.hydrate().catch(error => {
        logger.error('StoreManager', `恢复存储 ${store.getMetadata().namespace} 状态失败`, error);
        this.eventBus.emitError(
          new StoreError(
            StoreErrorCode.HYDRATION_FAILED,
            'Failed to hydrate store state',
            error,
            store.getMetadata().namespace
          )
        );
      })
    );
    await Promise.all(promises);
    this.isInitialized = true;
    this.notifySubscribers();
    logger.debug('StoreManager', '所有状态恢复完成');
  }

  /**
   * 重置所有状态
   */
  public async resetAll(): Promise<void> {
    const promises = Array.from(this.stores.values()).map(store => store.resetState());
    await Promise.all(promises);
    await this.storageAdapter.clearAll();
    this.notifySubscribers();
  }

  /**
   * 获取模型存储实例
   */
  public getModelStore(): ModelStore {
    const store = this.getStore<ModelStore>('model');
    if (!(store instanceof ModelStore)) {
      throw new StoreError(
        StoreErrorCode.STORE_NOT_FOUND,
        'Model store not found or invalid type',
        undefined,
        'model'
      );
    }
    return store;
  }
} 