import type { CharacterConfig } from '../../modules/character/types';
import type { GameConfigState } from '../../types/config';
import type { DebateRole } from '../../types/player';

// 状态元数据
export interface StateMeta {
  version: string;
  timestamp: number;
  lastModified: number;
}

// 存储状态接口
export interface StorageState extends UnifiedState {
  meta: StateMeta;
}

// 角色状态接口
export interface CharacterStateStorage {
  characters: CharacterConfig[];
  templates: any[];
  activeMode: 'dify' | 'direct';
  difyConfig: any;
  directConfig: any;
}

// 统一的角色状态
export interface UnifiedCharacterState {
  byId: Record<string, CharacterConfig>;
  allIds: string[];
  activeCharacters: string[];
  meta: {
    lastModified: number;
    version: string;
  };
}

// 统一的辩论状态
export interface UnifiedDebateState {
  topic: {
    title: string;
    description: string;
    type: 'binary' | 'open';
  };
  players: {
    byId: Record<string, {
      id: string;
      name: string;
      role: DebateRole;
      characterId?: string;
      isAI: boolean;
      status: 'ready' | 'speaking' | 'waiting' | 'finished';
      order?: number;
    }>;
    allIds: string[];
  };
  currentState: {
    round: number;
    currentSpeaker?: string;
    nextSpeaker?: string;
    status: 'preparing' | 'ongoing' | 'paused' | 'finished';
    lastModified?: number;
  };
  rules: {
    format: 'structured' | 'free';
    totalRounds: number;
    timeLimit?: number;
    basicRules?: {
      speechLengthLimit: {
        min: number;
        max: number;
      };
      allowEmptySpeech: boolean;
      allowRepeatSpeech: boolean;
    };
    advancedRules?: {
      allowQuoting: boolean;
      requireResponse: boolean;
      allowStanceChange: boolean;
      requireEvidence: boolean;
    };
  };
  judge: {
    characterId: string;
    name?: string;
    avatar?: string;
  };
  judging: {
    description: string;
    dimensions: Array<{
      name: string;
      weight: number;
      description: string;
      criteria: string[];
    }>;
    totalScore: number;
  };
}

// 统一的配置状态
export interface UnifiedConfigState {
  activeMode: 'dify' | 'direct';
  settings: {
    dify?: {
      serverUrl: string;
      apiKey: string;
      workflowId: string;
      parameters: Record<string, any>;
    };
    direct?: {
      provider: string;
      apiKey: string;
      model: string;
      parameters: Record<string, any>;
    };
  };
}

// 完整的统一状态
export interface UnifiedState {
  characters: UnifiedCharacterState;
  debate: UnifiedDebateState;
  config: UnifiedConfigState;
}

// Action 类型定义
export type UnifiedAction = 
  | { type: 'CHARACTER_UPDATED'; payload: { id: string; changes: Partial<CharacterConfig> } }
  | { type: 'PLAYER_UPDATED'; payload: { id: string; changes: Partial<UnifiedDebateState['players']['byId'][string]> } }
  | { type: 'DEBATE_STATE_UPDATED'; payload: Partial<UnifiedDebateState['currentState']> }
  | { type: 'CONFIG_UPDATED'; payload: Partial<UnifiedConfigState> }
  | { type: 'BATCH_UPDATE'; payload: Partial<UnifiedState> };

// 订阅者类型
export type Subscriber = (state: UnifiedState) => void;
export type Unsubscribe = () => void; 