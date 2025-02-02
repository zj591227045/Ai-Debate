import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CharacterConfig, DifyConfig, DirectAPIConfig } from '../types';
import { CharacterTemplate, defaultTemplates } from '../types/template';

// 状态接口
interface CharacterState {
  characters: CharacterConfig[];
  templates: CharacterTemplate[];
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
  | { type: 'ADD_TEMPLATE'; payload: CharacterTemplate }
  | { type: 'DELETE_TEMPLATE'; payload: string }
  | { type: 'SET_STATE'; payload: CharacterState }
  | { type: 'SET_ACTIVE_MODE'; payload: 'dify' | 'direct' }
  | { type: 'SET_DIFY_CONFIG'; payload: DifyConfig }
  | { type: 'SET_DIRECT_CONFIG'; payload: DirectAPIConfig }
  | { type: 'SAVE_CALL_CONFIG'; payload: { type: 'dify' | 'direct'; config: DifyConfig | DirectAPIConfig } };

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
  console.log('Character Reducer:', { type: action.type, payload: action.payload });
  
  let newState: CharacterState;
  switch (action.type) {
    case 'SET_CHARACTERS':
      newState = {
        ...state,
        characters: action.payload,
      };
      break;
    case 'ADD_CHARACTER':
      console.log('Adding new character:', action.payload);
      // 检查是否已存在相同ID的角色
      const existingCharacter = state.characters.find(char => char.id === action.payload.id);
      if (existingCharacter) {
        console.log('Character with same ID exists, updating instead:', existingCharacter);
        newState = {
          ...state,
          characters: state.characters.map(char =>
            char.id === action.payload.id ? action.payload : char
          ),
        };
      } else {
        console.log('Adding new character to list');
        newState = {
          ...state,
          characters: [...state.characters, action.payload],
        };
      }
      break;
    case 'UPDATE_CHARACTER':
      newState = {
        ...state,
        characters: state.characters.map((char) =>
          char.id === action.payload.id ? action.payload : char
        ),
      };
      break;
    case 'DELETE_CHARACTER':
      newState = {
        ...state,
        characters: state.characters.filter((char) => char.id !== action.payload),
      };
      break;
    case 'ADD_TEMPLATE':
      newState = {
        ...state,
        templates: [...state.templates, action.payload],
      };
      break;
    case 'DELETE_TEMPLATE':
      newState = {
        ...state,
        templates: state.templates.filter((template) => template.id !== action.payload),
      };
      break;
    case 'SET_STATE':
      newState = action.payload;
      break;
    case 'SET_ACTIVE_MODE':
      newState = {
        ...state,
        activeMode: action.payload,
      };
      break;
    case 'SET_DIFY_CONFIG':
      newState = {
        ...state,
        difyConfig: action.payload,
      };
      break;
    case 'SET_DIRECT_CONFIG':
      newState = {
        ...state,
        directConfig: action.payload,
      };
      break;
    case 'SAVE_CALL_CONFIG':
      newState = {
        ...state,
        activeMode: action.payload.type,
        ...(action.payload.type === 'dify'
          ? { difyConfig: action.payload.config as DifyConfig }
          : { directConfig: action.payload.config as DirectAPIConfig }),
      };
      break;
    default:
      return state;
  }
  
  console.log('New state:', newState);
  return newState;
}

// Provider组件
export function CharacterProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(characterReducer, (() => {
    try {
      const savedState = localStorage.getItem('characterState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        console.log('Loading initial state from localStorage:', parsedState);
        
        // 确保数据结构完整
        const validState: CharacterState = {
          // 保持现有角色列表，确保每个角色的ID都是唯一的
          characters: Array.isArray(parsedState.characters) 
            ? parsedState.characters.reduce((acc: CharacterConfig[], char: CharacterConfig) => {
                // 检查是否已存在相同ID的角色
                const existingIndex = acc.findIndex(c => c.id === char.id);
                if (existingIndex >= 0) {
                  // 如果存在，更新它
                  acc[existingIndex] = char;
                } else {
                  // 如果不存在，添加它
                  acc.push(char);
                }
                return acc;
              }, [])
            : [],
          // 合并默认模板和已保存的模板
          templates: Array.isArray(parsedState.templates) 
            ? [...defaultTemplates, ...parsedState.templates.filter((template: CharacterTemplate) => 
                !defaultTemplates.some(defaultTemplate => defaultTemplate.id === template.id)
              )]
            : [...defaultTemplates],
          activeMode: parsedState.activeMode || 'direct',
          difyConfig: {
            serverUrl: '',
            apiKey: '',
            workflowId: '',
            parameters: {},
            ...parsedState.difyConfig,
          },
          directConfig: {
            provider: '',
            apiKey: '',
            model: '',
            parameters: {},
            ...parsedState.directConfig,
          },
        };

        console.log('Validated state:', validState);
        return validState;
      }
    } catch (error) {
      console.error('Error loading initial state from localStorage:', error);
    }
    return initialState;
  })());

  // 保存状态到本地存储
  useEffect(() => {
    try {
      // 在保存之前验证状态的完整性
      const stateToSave = {
        ...state,
        characters: Array.isArray(state.characters) 
          ? state.characters.reduce((acc: CharacterConfig[], char: CharacterConfig) => {
              // 检查是否已存在相同ID的角色
              const existingIndex = acc.findIndex(c => c.id === char.id);
              if (existingIndex >= 0) {
                // 如果存在，更新它
                acc[existingIndex] = char;
              } else {
                // 如果不存在，添加它
                acc.push(char);
              }
              return acc;
            }, [])
          : [],
        templates: Array.isArray(state.templates) ? state.templates : [...defaultTemplates],
      };
      console.log('Saving state to localStorage:', stateToSave);
      localStorage.setItem('characterState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
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
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}

// 导出Context（用于测试）
export { CharacterContext }; 