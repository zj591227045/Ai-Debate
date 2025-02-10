import type { CharacterConfig } from '../../modules/character/types';
import type { GameConfigState } from '../../types/config';
import type { DebateRole } from '../../types/player';
import type { Judge } from '../../types/judge';

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
  templates: CharacterConfig[];
  activeMode: 'dify' | 'direct';
  difyConfig: any;
  directConfig: any;
}

// 统一的角色状态
export interface UnifiedCharacterState {
  byId: Record<string, CharacterConfig>;
  activeCharacters: string[];
  meta: {
    lastModified: number;
    version?: string;
  };
  templates?: {
    byId: Record<string, CharacterConfig>;
  };
}

// 统一的辩论状态
export interface UnifiedDebateState {
  players: {
    byId: Record<string, {
      characterId: string;
      role: DebateRole;
      isAI: boolean;
      name: string;
      id: string;
      status: 'ready' | 'speaking' | 'waiting' | 'finished';
    }>;
  };
  currentState: {
    round: number;
    status: 'preparing' | 'ongoing' | 'finished';
    currentSpeaker?: string;
  };
  rules: RuleConfig;
  topic: TopicConfig;
  judge?: {
    characterId: string;
    name: string;
    avatar?: string;
    config?: any;
  };
  judging: {
    dimensions: Array<{
      name: string;
      weight: number;
      description: string;
    }>;
    totalScore: number;
    description: string;
    selectedJudge?: {
      id: string;
      name: string;
      avatar?: string;
      modelConfig?: any;
    };
  };
}

// 话题配置
export interface TopicConfig {
  title: string;
  description: string;
  type: 'binary' | 'open';
  background?: string;
}

// 规则配置
export interface RuleConfig {
  format: 'structured' | 'free';
  timeLimit: number;
  totalRounds: number;
  debateFormat: 'structured' | 'free';
  description: string;
  basicRules: {
    speechLengthLimit: {
      min: number;
      max: number;
    };
    allowEmptySpeech: boolean;
    allowRepeatSpeech: boolean;
  };
  advancedRules: {
    allowQuoting: boolean;
    requireResponse: boolean;
    allowStanceChange: boolean;
    requireEvidence: boolean;
    minLength: number;
    maxLength: number;
  };
}

// 辩论配置
export interface DebateConfig {
  topic: {
    title: string;
    description: string;
    type: 'binary' | 'open';
  };
  rules: RuleConfig;
  judging: {
    description: string;
    dimensions: {
      id: string;
      name: string;
      weight: number;
      description: string;
      criteria: string[];
    }[];
    totalScore: number;
    selectedJudge?: Judge & { modelConfig?: any };
  };
  players: {
    byId: Record<string, {
      characterId: string;
      role: DebateRole;
      isAI: boolean;
      name: string;
      id: string;
      status: 'ready' | 'speaking' | 'waiting' | 'finished';
    }>;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UnifiedConfigState {
  activeMode: 'dify' | 'direct';
  settings: {
    roundCount: number;
    timeLimit: number;
    language: string;
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
  config: GameConfigState;
}

// Action 类型定义
export interface UnifiedAction {
  type: string;
  payload: any;
}

// 订阅者类型
export type UnifiedSubscriber = (state: UnifiedState) => void;

// 分派类型
export interface UnifiedDispatch {
  (action: UnifiedAction): void;
} 