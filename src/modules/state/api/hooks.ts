import { useCallback, useEffect, useState } from 'react';
import { StoreManager } from '../core/StoreManager';
import { UnifiedState } from '../types';
import { BaseStore } from '../core/BaseStore';
import { LLMStore } from '../stores/LLMStore';
import { ModelStore } from '../stores/ModelStore';
import { GameConfigStore } from '../stores/GameConfigStore';
import { GameRulesStore } from '../stores/GameRulesStore';

type StoreMap = {
  llm: LLMStore;
  model: ModelStore;
  gameConfig: GameConfigStore;
  gameRules: GameRulesStore;
  session: BaseStore<UnifiedState['session']>;
};

type StoreInstance<K extends keyof UnifiedState> = BaseStore<UnifiedState[K]>;

/**
 * 使用存储 Hook
 */
export function useStore<K extends keyof UnifiedState>(namespace: K) {
  const [state, setState] = useState<UnifiedState[K]>(() => {
    const manager = StoreManager.getInstance();
    try {
      if (!manager.isStoreInitialized()) {
        throw new Error('Store is not initialized yet');
      }
      const store = manager.getStore(namespace) as StoreInstance<K>;
      return store.getState();
    } catch (error) {
      console.warn(`Failed to get initial state for ${namespace}:`, error);
      return {} as UnifiedState[K];
    }
  });

  useEffect(() => {
    const manager = StoreManager.getInstance();
    if (!manager.isStoreInitialized()) {
      return;
    }

    try {
      const store = manager.getStore(namespace) as StoreInstance<K>;
      setState(store.getState());
      const unsubscribe = store.subscribe(() => {
        setState(store.getState());
      });
      return unsubscribe;
    } catch (error) {
      console.error(`Failed to subscribe to ${namespace}:`, error);
    }
  }, [namespace]);

  const updateState = useCallback((update: Partial<UnifiedState[K]>) => {
    const manager = StoreManager.getInstance();
    if (!manager.isStoreInitialized()) {
      console.warn('Cannot update state before initialization');
      return;
    }

    try {
      const store = manager.getStore(namespace) as StoreInstance<K>;
      store.setState(update);
    } catch (error) {
      console.error(`Failed to update ${namespace}:`, error);
    }
  }, [namespace]);

  return {
    state,
    setState: updateState
  };
}

/**
 * 使用存储选择器 Hook
 */
export function useStoreSelector<K extends keyof UnifiedState, R>(
  namespace: K,
  selector: (state: UnifiedState[K]) => R
) {
  const [selectedState, setSelectedState] = useState<R>(() => {
    const store = StoreManager.getInstance().getStore(namespace) as StoreInstance<K>;
    return selector(store.getState());
  });

  useEffect(() => {
    const store = StoreManager.getInstance().getStore(namespace) as StoreInstance<K>;
    const unsubscribe = store.subscribe(() => {
      setSelectedState(selector(store.getState()));
    });
    return unsubscribe;
  }, [namespace, selector]);

  return selectedState;
}

/**
 * 使用存储调度 Hook
 */
export function useStoreDispatch<K extends keyof UnifiedState>(namespace: K) {
  return useCallback((action: Partial<UnifiedState[K]>) => {
    const store = StoreManager.getInstance().getStore(namespace) as StoreInstance<K>;
    store.setState(action);
  }, [namespace]);
}

/**
 * 使用统一状态 Hook
 */
export function useUnifiedState() {
  const [state, setState] = useState<UnifiedState>(() =>
    StoreManager.getInstance().getUnifiedState()
  );

  useEffect(() => {
    const manager = StoreManager.getInstance();
    const unsubscribe = manager.subscribe(() => {
      setState(manager.getUnifiedState());
    });
    return unsubscribe;
  }, []);

  const updateState = useCallback((update: Partial<UnifiedState>) => {
    StoreManager.getInstance().updateUnifiedState(update);
  }, []);

  return {
    state,
    setState: updateState
  };
}

/**
 * 使用存储持久化 Hook
 */
export function useStorePersistence<K extends keyof UnifiedState>(namespace: K) {
  const store = StoreManager.getInstance().getStore(namespace) as StoreInstance<K>;

  const persist = useCallback(() => {
    return store.persist();
  }, [store]);

  const hydrate = useCallback(() => {
    return store.hydrate();
  }, [store]);

  return {
    persist,
    hydrate
  };
}

/**
 * 使用存储重置 Hook
 */
export function useStoreReset<K extends keyof UnifiedState>(namespace: K) {
  const store = StoreManager.getInstance().getStore(namespace) as StoreInstance<K>;

  return useCallback(() => {
    store.resetState();
  }, [store]);
} 