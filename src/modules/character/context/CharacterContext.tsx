import React, { createContext, useContext, useReducer, useEffect } from 'react';
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
      console.log('正在删除角色:', characterId);
      
      // 检查角色是否存在
      const characterToDelete = state.characters.find(char => char.id === characterId);
      if (!characterToDelete) {
        console.error('要删除的角色不存在:', characterId);
        return {
          ...state,
          error: `角色 ${characterId} 不存在`
        };
      }

      // 从角色列表中删除
      const updatedCharacters = state.characters.filter(char => char.id !== characterId);
      console.log('删除后的角色列表:', updatedCharacters);

      // 立即更新 localStorage
      try {
        const newState = {
          ...state,
          characters: updatedCharacters,
          error: undefined
        };
        localStorage.setItem('characterState', JSON.stringify(newState));
        console.log('角色删除后的状态已保存到 localStorage');
        return newState;
      } catch (error) {
        console.error('保存状态到 localStorage 失败:', error);
        return {
          ...state,
          characters: updatedCharacters,
          error: '删除成功但保存状态失败'
        };
      }
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
      console.group('SET_STATE - Character Processing');
      console.log('Current state:', {
        charactersCount: state.characters.length,
        characters: state.characters.map(c => ({ id: c.id, name: c.name }))
      });
      console.log('Payload:', {
        hasCharacters: Array.isArray(action.payload.characters),
        charactersCount: action.payload.characters?.length || 0,
        characters: action.payload.characters?.map((c: any) => ({ id: c.id, name: c.name }))
      });
      
      // 处理角色数据
      const characters = Array.isArray(action.payload.characters) 
        ? action.payload.characters.map((char: any) => {
            console.log('Processing character:', {
              id: char.id,
              name: char.name,
              hasCallConfig: !!char.callConfig
            });
            
            return {
              ...char,
              id: char.id || `char_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
              name: char.name || '未命名角色',
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
              updatedAt: Date.now()
            };
          })
        : state.characters;
        
      console.log('Processed characters:', {
        count: characters.length,
        characters: characters.map((c: any) => ({ id: c.id, name: c.name }))
      });
      
      // 创建新状态
      const newState = {
        ...state,
        characters,
        templates: Array.isArray(action.payload.templates) 
          ? action.payload.templates 
          : state.templates,
        activeMode: action.payload.activeMode || state.activeMode,
        difyConfig: action.payload.difyConfig 
          ? { ...state.difyConfig, ...action.payload.difyConfig }
          : state.difyConfig,
        directConfig: action.payload.directConfig
          ? { ...state.directConfig, ...action.payload.directConfig }
          : state.directConfig,
        loading: false
      };
      
      console.log('New state:', {
        charactersCount: newState.characters.length,
        characters: newState.characters.map((c: any) => ({ id: c.id, name: c.name }))
      });
      console.groupEnd();
      
      return newState;
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
  const [state, dispatch] = useReducer(characterReducer, initialState);
  const characterService = new CharacterConfigService();

  // 初始化时加载数据
  useEffect(() => {
    async function loadData() {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const characters = await characterService.getActiveCharacters();
        const templates = await characterService.getTemplates();
        
        // 确保所有必需的字段都存在
        const processedCharacters = characters.map(char => ({
          ...char,
          isTemplate: false,
          createdAt: char.createdAt || Date.now(),
          updatedAt: char.updatedAt || Date.now(),
          description: char.description || '',
          callConfig: {
            ...char.callConfig,
            type: char.callConfig.type || 'direct',
            direct: char.callConfig.direct ? {
              modelId: char.callConfig.direct.modelId || ''
            } : undefined
          }
        }));

        const processedTemplates = templates.map(temp => ({
          ...temp,
          isTemplate: true,
          createdAt: temp.createdAt || Date.now(),
          updatedAt: temp.updatedAt || Date.now(),
          description: temp.description || ''
        }));

        dispatch({
          type: 'SET_STATE',
          payload: {
            ...initialState,
            characters: processedCharacters,
            templates: [...defaultTemplates, ...processedTemplates],
            loading: false
          } as CharacterState
        });
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
    if (!state.loading) {
      const saveData = async () => {
        try {
          // 保存角色数据
          const characters = state.characters.filter(char => !char.isTemplate);
          await Promise.all(characters.map(async (char) => {
            try {
              const existing = await characterService.getById(char.id);
              if (existing) {
                await characterService.update(char.id, {
                  ...char,
                  isTemplate: false,
                  updatedAt: Date.now()
                });
              } else {
                await characterService.create({
                  ...char,
                  isTemplate: false,
                  createdAt: Date.now(),
                  updatedAt: Date.now()
                });
              }
            } catch (error) {
              console.error(`保存角色 ${char.id} 失败:`, error);
            }
          }));

          // 保存模板数据
          const templates = state.templates.filter(temp => temp.isTemplate);
          await Promise.all(templates.map(async (temp) => {
            try {
              const existing = await characterService.getById(temp.id);
              if (existing) {
                await characterService.update(temp.id, {
                  ...temp,
                  isTemplate: true,
                  updatedAt: Date.now()
                });
              } else {
                await characterService.create({
                  ...temp,
                  isTemplate: true,
                  createdAt: Date.now(),
                  updatedAt: Date.now()
                });
              }
            } catch (error) {
              console.error(`保存模板 ${temp.id} 失败:`, error);
            }
          }));
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
  }, [state.characters, state.templates]);

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