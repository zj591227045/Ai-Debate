import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ModelConfig, ProviderConfig, DEFAULT_PROVIDERS } from '../types';

interface ModelState {
  models: ModelConfig[];
  providers: ProviderConfig[];
}

type ModelAction =
  | { type: 'SET_MODELS'; payload: ModelConfig[] }
  | { type: 'ADD_MODEL'; payload: ModelConfig }
  | { type: 'UPDATE_MODEL'; payload: ModelConfig }
  | { type: 'DELETE_MODEL'; payload: string }
  | { type: 'UPDATE_PROVIDER'; payload: ProviderConfig }
  | { type: 'SET_PROVIDERS'; payload: ProviderConfig[] };

const initialState: ModelState = {
  models: [],
  providers: DEFAULT_PROVIDERS,
};

const ModelContext = createContext<{
  state: ModelState;
  dispatch: React.Dispatch<ModelAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

function modelReducer(state: ModelState, action: ModelAction): ModelState {
  switch (action.type) {
    case 'SET_MODELS':
      return {
        ...state,
        models: action.payload,
      };
    case 'ADD_MODEL':
      return {
        ...state,
        models: [...state.models, action.payload],
      };
    case 'UPDATE_MODEL':
      return {
        ...state,
        models: state.models.map((model) =>
          model.id === action.payload.id ? action.payload : model
        ),
      };
    case 'DELETE_MODEL':
      return {
        ...state,
        models: state.models.filter((model) => model.id !== action.payload),
      };
    case 'UPDATE_PROVIDER':
      return {
        ...state,
        providers: state.providers.map((provider) =>
          provider.id === action.payload.id ? action.payload : provider
        ),
      };
    case 'SET_PROVIDERS':
      return {
        ...state,
        providers: action.payload,
      };
    default:
      return state;
  }
}

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(modelReducer, initialState);

  // 从本地存储加载数据
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const storedData = localStorage.getItem('modelConfig');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          dispatch({ type: 'SET_MODELS', payload: parsedData.models });
          if (parsedData.providers) {
            dispatch({ type: 'SET_PROVIDERS', payload: parsedData.providers });
          }
        }
      } catch (error) {
        console.error('加载模型配置失败:', error);
      }
    };

    loadFromStorage();
  }, []);

  // 保存数据到本地存储
  useEffect(() => {
    try {
      localStorage.setItem('modelConfig', JSON.stringify(state));
    } catch (error) {
      console.error('保存模型配置失败:', error);
    }
  }, [state]);

  return (
    <ModelContext.Provider value={{ state, dispatch }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel必须在ModelProvider内部使用');
  }
  return context;
}

export { ModelContext }; 