import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CharacterConfig, DifyConfig, DirectAPIConfig } from '../types';
import { CharacterTemplate, defaultTemplates } from '../types/template';

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
  console.log('========== Character Reducer Start ==========');
  console.log('Action Type:', action.type);
  console.log('Current State:', {
    charactersCount: state.characters.length,
    templatesCount: state.templates.length,
    activeMode: state.activeMode,
    hasCharacters: Array.isArray(state.characters),
    firstCharacter: state.characters[0]
  });
  console.log('Action Payload:', {
    type: action.type,
    payloadType: typeof action.payload,
    isArray: Array.isArray(action.payload),
    payloadLength: Array.isArray(action.payload) ? action.payload.length : 'N/A',
    payload: action.payload
  });
  
  let newState: CharacterState;
  switch (action.type) {
    case 'SET_CHARACTERS': {
      const characters = action.payload;
      return {
        ...state,
        characters,
        loading: false
      };
    }
    
    case 'ADD_CHARACTER': {
      const character = action.payload;
      return {
        ...state,
        characters: [...state.characters, character]
      };
    }
    
    case 'UPDATE_CHARACTER': {
      const updatedCharacter = action.payload;
      return {
        ...state,
        characters: state.characters.map(char => 
          char.id === updatedCharacter.id ? updatedCharacter : char
        )
      };
    }
    
    case 'DELETE_CHARACTER': {
      const characterId = action.payload;
      return {
        ...state,
        characters: state.characters.filter(char => char.id !== characterId)
      };
    }
    
    case 'SET_LOADING': {
      const loading = action.payload;
      return {
        ...state,
        loading
      };
    }
    
    case 'SET_ERROR': {
      const error = action.payload;
      return {
        ...state,
        error,
        loading: false
      };
    }
    
    case 'ADD_TEMPLATE': {
      console.log('ADD_TEMPLATE - Current templates:', state.templates);
      console.log('ADD_TEMPLATE - Adding template:', action.payload);
      // 检查是否已存在相同ID的模板
      const existingTemplate = state.templates.find(t => t.id === action.payload.id);
      if (existingTemplate) {
        newState = {
          ...state,
          templates: state.templates.map(t =>
            t.id === action.payload.id ? action.payload : t
          ),
        };
      } else {
        newState = {
          ...state,
          templates: [...state.templates, action.payload],
        };
      }
      console.log('ADD_TEMPLATE - New state:', newState);
      break;
    }
    case 'DELETE_TEMPLATE':
      newState = {
        ...state,
        templates: state.templates.filter((template) => template.id !== action.payload),
      };
      break;
    case 'SET_TEMPLATES':
      console.log('SET_TEMPLATES - Payload:', action.payload);
      newState = {
        ...state,
        templates: Array.isArray(action.payload) ? [...action.payload] : [],
      };
      console.log('SET_TEMPLATES - New state:', newState);
      break;
    case 'SET_STATE': {
      console.log('SET_STATE - Start processing');
      console.log('SET_STATE - Current state:', JSON.stringify(state, null, 2));
      console.log('SET_STATE - Action payload:', JSON.stringify(action.payload, null, 2));
      
      // 处理角色数据
      const characters = Array.isArray(action.payload.characters) 
        ? action.payload.characters.map((char, index) => {
            console.log(`Processing character ${index}:`, {
              id: char.id,
              name: char.name,
              hasPersona: !!char.persona,
              hasCallConfig: !!char.callConfig
            });
            
            return {
              ...char,
              persona: char.persona || {
                personality: [],
                speakingStyle: '',
                background: '',
                values: [],
                argumentationStyle: []
              },
              callConfig: char.callConfig || {
                type: 'direct'
              },
              createdAt: char.createdAt || Date.now(),
              updatedAt: char.updatedAt || Date.now()
            };
          })
        : state.characters;
        
      console.log('SET_STATE - Processed characters count:', characters.length);
      
      // 创建新状态，保留现有的角色数据
      newState = {
        ...state,
        characters: characters.length > 0 ? characters : state.characters,
        templates: Array.isArray(action.payload.templates) 
          ? action.payload.templates 
          : state.templates,
        activeMode: action.payload.activeMode || state.activeMode,
        difyConfig: action.payload.difyConfig 
          ? { ...state.difyConfig, ...action.payload.difyConfig }
          : state.difyConfig,
        directConfig: action.payload.directConfig
          ? { ...state.directConfig, ...action.payload.directConfig }
          : state.directConfig
      };
      
      console.log('SET_STATE - New state:', {
        hasCharacters: Array.isArray(newState.characters),
        charactersLength: newState.characters.length,
        sameTemplates: newState.templates === state.templates,
        sameConfigs: 
          newState.difyConfig === state.difyConfig && 
          newState.directConfig === state.directConfig
      });
      
      break;
    }
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
      console.log('Unknown action type:', (action as CharacterAction).type);
      return state;
  }
  
  console.log('Final new state:', newState);
  return newState;
}

// Provider组件
export function CharacterProvider({ children }: { children: React.ReactNode }) {
  console.log('========== CharacterProvider 初始化开始 ==========');
  
  const [state, dispatch] = useReducer(characterReducer, (() => {
    try {
      const savedState = localStorage.getItem('characterState');
      console.log('从 localStorage 读取的原始数据:', savedState);
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        console.log('解析后的状态数据:', {
          hasCharacters: Array.isArray(parsedState.characters),
          charactersCount: parsedState.characters?.length,
          characters: parsedState.characters,
          templatesCount: parsedState.templates?.length
        });
        
        // 确保数据结构完整
        const validState: CharacterState = {
          characters: Array.isArray(parsedState.characters) 
            ? parsedState.characters.map((char: CharacterConfig) => ({
                id: char.id || `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: char.name || '未命名角色',
                description: char.description || '',
                avatar: char.avatar || '',
                persona: {
                  personality: Array.isArray(char.persona?.personality) ? char.persona.personality : [],
                  speakingStyle: char.persona?.speakingStyle || '',
                  background: char.persona?.background || '',
                  values: Array.isArray(char.persona?.values) ? char.persona.values : [],
                  argumentationStyle: Array.isArray(char.persona?.argumentationStyle) ? char.persona.argumentationStyle : []
                },
                callConfig: {
                  ...(char.callConfig || {}),
                  type: char.callConfig?.type || 'direct'
                },
                createdAt: char.createdAt || Date.now(),
                updatedAt: char.updatedAt || Date.now()
              }))
            : [],
          templates: Array.isArray(parsedState.templates) 
            ? [...defaultTemplates, ...parsedState.templates]
            : [...defaultTemplates],
          activeMode: parsedState.activeMode || 'direct',
          difyConfig: {
            serverUrl: parsedState.difyConfig?.serverUrl || '',
            apiKey: parsedState.difyConfig?.apiKey || '',
            workflowId: parsedState.difyConfig?.workflowId || '',
            parameters: parsedState.difyConfig?.parameters || {},
          },
          directConfig: {
            provider: parsedState.directConfig?.provider || '',
            apiKey: parsedState.directConfig?.apiKey || '',
            model: parsedState.directConfig?.model || '',
            parameters: parsedState.directConfig?.parameters || {},
          },
          loading: parsedState.loading || true,
        };

        console.log('验证后的初始状态:', {
          charactersCount: validState.characters.length,
          characters: validState.characters,
          templatesCount: validState.templates.length
        });
        
        return validState;
      }
    } catch (error) {
      console.error('初始化过程中出错:', error);
    }
    
    console.log('使用默认初始状态');
    return {
      ...initialState,
      templates: [...defaultTemplates] // 确保至少有默认模板
    };
  })());

  // 保存状态到本地存储
  useEffect(() => {
    console.log('========== 状态变更，准备保存 ==========');
    console.log('当前状态:', {
      charactersCount: state.characters.length,
      characters: state.characters,
      templatesCount: state.templates.length
    });
    
    if (state.characters.length > 0) {
      try {
        localStorage.setItem('characterState', JSON.stringify(state));
        console.log('状态保存成功');
      } catch (error) {
        console.error('保存状态时出错:', error);
      }
    } else {
      console.warn('characters 数组为空，跳过保存');
    }
  }, [state]);

  // 添加状态变更的监控
  useEffect(() => {
    console.log('========== 状态监控 ==========');
    console.log('characters 数组:', state.characters);
    console.log('characters 长度:', state.characters.length);
    console.log('templates 长度:', state.templates.length);
    console.log('activeMode:', state.activeMode);
  }, [state.characters, state.templates, state.activeMode]);

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