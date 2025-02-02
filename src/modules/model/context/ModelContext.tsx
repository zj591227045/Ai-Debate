import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ModelConfig } from '../types';
import { ModelConfigService } from '../../storage/services/ModelConfigService';

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
  error: null,
};

const ModelContext = createContext<{
  state: ModelState;
  dispatch: React.Dispatch<ModelAction>;
} | undefined>(undefined);

function modelReducer(state: ModelState, action: ModelAction): ModelState {
  switch (action.type) {
    case 'LOAD_MODELS_START':
      return { ...state, isLoading: true, error: null };
    case 'LOAD_MODELS_SUCCESS':
      return { ...state, models: action.payload, isLoading: false };
    case 'LOAD_MODELS_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'ADD_MODEL':
      return { ...state, models: [...state.models, action.payload] };
    case 'UPDATE_MODEL':
      return {
        ...state,
        models: state.models.map(model =>
          model.id === action.payload.id ? action.payload : model
        ),
      };
    case 'DELETE_MODEL':
      return {
        ...state,
        models: state.models.filter(model => model.id !== action.payload),
      };
    case 'TOGGLE_MODEL':
      return {
        ...state,
        models: state.models.map(model =>
          model.id === action.payload.id
            ? { ...model, isEnabled: action.payload.isEnabled }
            : model
        ),
      };
    default:
      return state;
  }
}

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(modelReducer, initialState);
  const modelService = new ModelConfigService();

  // 初始加载
  useEffect(() => {
    async function loadModels() {
      dispatch({ type: 'LOAD_MODELS_START' });
      try {
        const models = await modelService.getAll();
        dispatch({ type: 'LOAD_MODELS_SUCCESS', payload: models });
      } catch (error) {
        dispatch({
          type: 'LOAD_MODELS_ERROR',
          payload: (error as Error).message,
        });
      }
    }
    loadModels();
  }, []);

  // 数据变更时保存
  useEffect(() => {
    async function saveModels() {
      try {
        // 只在有数据时保存，避免覆盖初始加载
        if (state.models.length > 0) {
          await Promise.all(
            state.models.map(model => modelService.update(model.id, model))
          );
        }
      } catch (error) {
        console.error('保存模型配置失败:', error);
      }
    }
    saveModels();
  }, [state.models]);

  return (
    <ModelContext.Provider value={{ state, dispatch }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
} 