import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { ModelConfig } from '../types';
import { StoreManager } from '@state/core';

interface ModelState {
  models: ModelConfig[];
  isLoading: boolean;
  error: string | null;
}

type ModelAction =
  | { type: 'LOAD_MODELS_START' }
  | { type: 'LOAD_MODELS_SUCCESS'; payload: ModelConfig[] }
  | { type: 'LOAD_MODELS_ERROR'; payload: string }
  | { type: 'ADD_MODEL'; payload: ModelConfig }
  | { type: 'UPDATE_MODEL'; payload: ModelConfig }
  | { type: 'DELETE_MODEL'; payload: string }
  | { type: 'TOGGLE_MODEL'; payload: { id: string; isEnabled: boolean } };

const initialState: ModelState = {
  models: [],
  isLoading: false,
  error: null
};

function modelReducer(state: ModelState, action: ModelAction): ModelState {
  switch (action.type) {
    case 'LOAD_MODELS_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'LOAD_MODELS_SUCCESS':
      return {
        ...state,
        models: action.payload,
        isLoading: false,
        error: null
      };
    case 'LOAD_MODELS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'ADD_MODEL':
      return {
        ...state,
        models: [...state.models, action.payload]
      };
    case 'UPDATE_MODEL':
      return {
        ...state,
        models: state.models.map(model =>
          model.id === action.payload.id ? action.payload : model
        )
      };
    case 'DELETE_MODEL':
      return {
        ...state,
        models: state.models.filter(model => model.id !== action.payload)
      };
    case 'TOGGLE_MODEL':
      return {
        ...state,
        models: state.models.map(model =>
          model.id === action.payload.id
            ? { ...model, isEnabled: action.payload.isEnabled }
            : model
        )
      };
    default:
      return state;
  }
}

const ModelContext = createContext<{
  state: ModelState;
  dispatch: React.Dispatch<ModelAction>;
}>({
  state: initialState,
  dispatch: () => null
});

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(modelReducer, initialState);
  const storeManager = StoreManager.getInstance();

  // 加载模型配置
  const loadModels = useCallback(async () => {
    dispatch({ type: 'LOAD_MODELS_START' });
    try {
      const modelStore = storeManager.getModelStore();
      const rawModels = await modelStore.getAll();
      const models = rawModels.map(model => ({
        id: model.id,
        name: model.name,
        provider: model.provider,
        model: model.model || '',
        parameters: {
          temperature: model.parameters?.temperature ?? 0.7,
          maxTokens: model.parameters?.maxTokens ?? 2048,
          topP: model.parameters?.topP ?? 1.0,
          ...model.parameters
        },
        auth: model.auth || { baseUrl: '', apiKey: '' },
        isEnabled: model.isEnabled || false,
        createdAt: model.createdAt || Date.now(),
        updatedAt: model.updatedAt || Date.now()
      }));
      dispatch({ type: 'LOAD_MODELS_SUCCESS', payload: models });
    } catch (error) {
      console.error('加载模型配置失败:', error);
      dispatch({
        type: 'LOAD_MODELS_ERROR',
        payload: error instanceof Error ? error.message : '未知错误'
      });
    }
  }, []);

  // 监听存储变化
  useEffect(() => {
    const modelStore = storeManager.getModelStore();
    const unsubscribe = modelStore.subscribe(() => {
      loadModels();
    });

    // 初始加载
    loadModels();

    return () => {
      unsubscribe();
    };
  }, [loadModels]);

  return (
    <ModelContext.Provider value={{ state, dispatch }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider');
  }

  const { state, dispatch } = context;
  const storeManager = StoreManager.getInstance();

  const addModel = async (model: ModelConfig) => {
    try {
      const modelStore = storeManager.getModelStore();
      await modelStore.addModel(model);
      dispatch({ type: 'ADD_MODEL', payload: model });
    } catch (error) {
      console.error('添加模型失败:', error);
      throw error;
    }
  };

  const updateModel = async (model: ModelConfig) => {
    try {
      const modelStore = storeManager.getModelStore();
      await modelStore.updateModel(model.id, model);
      dispatch({ type: 'UPDATE_MODEL', payload: model });
    } catch (error) {
      console.error('更新模型失败:', error);
      throw error;
    }
  };

  const deleteModel = async (id: string) => {
    try {
      const modelStore = storeManager.getModelStore();
      await modelStore.deleteModel(id);
      dispatch({ type: 'DELETE_MODEL', payload: id });
    } catch (error) {
      console.error('删除模型失败:', error);
      throw error;
    }
  };

  const toggleModel = async (id: string, isEnabled: boolean) => {
    try {
      const modelStore = storeManager.getModelStore();
      await modelStore.toggleEnabled(id, isEnabled);
      dispatch({ type: 'TOGGLE_MODEL', payload: { id, isEnabled } });
    } catch (error) {
      console.error('切换模型状态失败:', error);
      throw error;
    }
  };

  return {
    state,
    dispatch,
    addModel,
    updateModel,
    deleteModel,
    toggleModel
  };
} 