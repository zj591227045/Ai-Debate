import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CharacterConfig, DifyConfig, DirectAPIConfig } from '../types';

// 状态接口
interface CharacterState {
  characters: CharacterConfig[];
  activeMode: 'dify' | 'direct';
  difyConfig: DifyConfig;
  directConfig: DirectAPIConfig;
}

// Action类型
type CharacterAction =
  | { type: 'SET_CHARACTERS'; payload: CharacterConfig[] }
  | { type: 'ADD_CHARACTER'; payload: CharacterConfig }
  | { type: 'UPDATE_CHARACTER'; payload: CharacterConfig }
  | { type: 'DELETE_CHARACTER'; payload: string }
  | { type: 'SET_ACTIVE_MODE'; payload: 'dify' | 'direct' }
  | { type: 'SET_DIFY_CONFIG'; payload: DifyConfig }
  | { type: 'SET_DIRECT_CONFIG'; payload: DirectAPIConfig };

// 初始状态
const initialState: CharacterState = {
  characters: [],
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
  switch (action.type) {
    case 'SET_CHARACTERS':
      return {
        ...state,
        characters: action.payload,
      };
    case 'ADD_CHARACTER':
      return {
        ...state,
        characters: [...state.characters, action.payload],
      };
    case 'UPDATE_CHARACTER':
      return {
        ...state,
        characters: state.characters.map((char) =>
          char.id === action.payload.id ? action.payload : char
        ),
      };
    case 'DELETE_CHARACTER':
      return {
        ...state,
        characters: state.characters.filter((char) => char.id !== action.payload),
      };
    case 'SET_ACTIVE_MODE':
      return {
        ...state,
        activeMode: action.payload,
      };
    case 'SET_DIFY_CONFIG':
      return {
        ...state,
        difyConfig: action.payload,
      };
    case 'SET_DIRECT_CONFIG':
      return {
        ...state,
        directConfig: action.payload,
      };
    default:
      return state;
  }
}

// Provider组件
export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(characterReducer, initialState);

  // 从本地存储加载数据
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const storedData = localStorage.getItem('characterConfig');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          dispatch({ type: 'SET_CHARACTERS', payload: parsedData.characters });
          dispatch({ type: 'SET_ACTIVE_MODE', payload: parsedData.activeMode });
          dispatch({ type: 'SET_DIFY_CONFIG', payload: parsedData.difyConfig });
          dispatch({ type: 'SET_DIRECT_CONFIG', payload: parsedData.directConfig });
        }
      } catch (error) {
        console.error('加载角色配置失败:', error);
      }
    };

    loadFromStorage();
  }, []);

  // 保存数据到本地存储
  useEffect(() => {
    try {
      localStorage.setItem('characterConfig', JSON.stringify(state));
    } catch (error) {
      console.error('保存角色配置失败:', error);
    }
  }, [state]);

  return (
    <CharacterContext.Provider value={{ state, dispatch }}>
      {children}
    </CharacterContext.Provider>
  );
}

// 自定义Hook
export function useCharacter() {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter必须在CharacterProvider内部使用');
  }
  return context;
}

// 导出Context（用于测试）
export { CharacterContext }; 