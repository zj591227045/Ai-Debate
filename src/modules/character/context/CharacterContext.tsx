import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { CharacterConfig, DifyConfig, DirectAPIConfig } from '../types';
import { CharacterTemplate, defaultTemplates } from '../types/template';
import { StorageManager } from '../../storage/StorageManager';
import { CharacterConfigService } from '../../storage/services/CharacterConfigService';

// 状态接口
export interface CharacterState {
  characters: CharacterConfig[];
  templates: CharacterTemplate[];
  activeMode: 'dify' | 'direct';
  difyConfig: DifyConfig;
  directConfig: DirectAPIConfig;
  loading: boolean;
  error?: string;
}

// Action类型
type CharacterAction =
  | { type: 'SET_CHARACTERS'; payload: CharacterConfig[] }
  | { type: 'ADD_CHARACTER'; payload: CharacterConfig }
  | { type: 'UPDATE_CHARACTER'; payload: CharacterConfig }
  | { type: 'DELETE_CHARACTER'; payload: string }
  | { type: 'ADD_TEMPLATE'; payload: CharacterTemplate }
  | { type: 'DELETE_TEMPLATE'; payload: string }
  | { type: 'SET_TEMPLATES'; payload: CharacterTemplate[] }
  | { type: 'SET_STATE'; payload: CharacterState }
  | { type: 'SET_ACTIVE_MODE'; payload: 'dify' | 'direct' }
  | { type: 'SET_DIFY_CONFIG'; payload: DifyConfig }
  | { type: 'SET_DIRECT_CONFIG'; payload: DirectAPIConfig }
  | { type: 'SAVE_CALL_CONFIG'; payload: { type: 'dify' | 'direct'; config: DifyConfig | DirectAPIConfig } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string };

// 初始状态
const initialState: CharacterState = {
  characters: [],
  templates: [...defaultTemplates],
  activeMode: 'direct',
  difyConfig: {
    serverUrl: '',
    apiKey: '',
    workflowId: '',
    parameters: {},
  },
  directConfig: {
    provider: '',
    apiKey: '',
    model: '',
    parameters: {},
  },
  loading: true,
};

// 创建Context
const CharacterContext = createContext<{
  state: CharacterState;
  dispatch: React.Dispatch<CharacterAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

// Reducer函数
function characterReducer(state: CharacterState, action: CharacterAction): CharacterState {
  console.log('Character Reducer Action:', action.type, action.payload);
  
  switch (action.type) {
    case 'SET_CHARACTERS':
      return {
        ...state,
        characters: action.payload,
        loading: false
      };
    
    case 'ADD_CHARACTER':
      console.log('Adding new character:', action.payload);
      return {
        ...state,
        characters: [...state.characters, action.payload]
      };
    
    case 'UPDATE_CHARACTER':
      console.log('Updating character:', action.payload);
      return {
        ...state,
        characters: state.characters.map(char => 
          char.id === action.payload.id ? { ...action.payload, updatedAt: Date.now() } : char
        )
      };
    
    case 'DELETE_CHARACTER':
      return {
        ...state,
        characters: state.characters.filter(char => char.id !== action.payload)
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    default:
      return state;
  }
}

// Provider组件
export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(characterReducer, initialState);
  const characterService = new CharacterConfigService();
  const [lastAction, setLastAction] = useState<CharacterAction | null>(null);

  // 初始化时加载数据
  useEffect(() => {
    async function loadData() {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const characters = await characterService.getActiveCharacters();
        dispatch({ type: 'SET_CHARACTERS', payload: characters });
      } catch (error) {
        console.error('加载角色数据失败:', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : '加载数据失败' 
        });
      }
    }
    loadData();
  }, []);

  // 监听状态变化，保存到localStorage
  useEffect(() => {
    if (!state.loading && lastAction) {
      const saveData = async () => {
        try {
          switch (lastAction.type) {
            case 'ADD_CHARACTER': {
              console.log('Saving new character:', lastAction.payload);
              await characterService.create(lastAction.payload);
              break;
            }
            case 'UPDATE_CHARACTER': {
              console.log('Saving updated character:', lastAction.payload);
              await characterService.update(lastAction.payload.id, lastAction.payload);
              break;
            }
            case 'DELETE_CHARACTER': {
              console.log('Deleting character:', lastAction.payload);
              await characterService.delete(lastAction.payload);
              break;
            }
          }
        } catch (error) {
          console.error('保存数据失败:', error);
          dispatch({ 
            type: 'SET_ERROR', 
            payload: error instanceof Error ? error.message : '保存数据失败' 
          });
        }
      };

      saveData();
    }
  }, [state.characters, lastAction]);

  const dispatchWithTracking = useCallback((action: CharacterAction) => {
    setLastAction(action);
    dispatch(action);
  }, []);

  return (
    <CharacterContext.Provider value={{ state, dispatch: dispatchWithTracking }}>
      {children}
    </CharacterContext.Provider>
  );
}

// 自定义Hook
export function useCharacter() {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}

// 导出Context（用于测试）
export { CharacterContext }; 