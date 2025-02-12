import type { GameConfigState } from './gameConfig';
import type { UnifiedPlayer, BaseDebateSpeech } from '../../../types/adapters';


/**
 * 辩论状态枚举
 */
export enum DebateStatus {
  /** 未开始 */
  NOT_STARTED = 'not_started',
  /** 进行中 */
  IN_PROGRESS = 'in_progress',
  /** 已暂停 */
  PAUSED = 'paused',
  /** 已完成 */
  COMPLETED = 'completed'
}

/**
 * 辩论进度接口
 */
export interface DebateProgress {
  /** 当前回合 */
  currentRound: number;
  /** 当前发言者 */
  currentSpeaker: string;
  /** 剩余时间 */
  remainingTime: number;
  /** 完成百分比 */
  completionPercentage: number;
}

/**
 * 辩论历史记录接口
 */
export interface DebateHistory {
  /** 发言记录 */
  speeches: BaseDebateSpeech[];
  /** 评分记录 */
  scores: Array<{
    /** 回合 */
    round: number;
    /** 选手 */
    player: string;
    /** 得分 */
    score: number;
    /** 评分项 */
    criteria: Record<string, number>;
  }>;
}

/**
 * 配置历史记录接口
 */
export interface ConfigHistory {
  /** 当前激活的配置 */
  activeConfig: GameConfigState;
  /** 历史配置记录 */
  savedConfigs: GameConfigState[];
  /** 最后修改时间 */
  lastModified: number;
}

/**
 * 辩论状态接口
 */
export interface DebateState {
  /** 状态 */
  status: DebateStatus;
  /** 进度信息 */
  progress: DebateProgress;
  /** 历史记录 */
  history: DebateHistory;
  /** 参与者列表 */
  players: UnifiedPlayer[];
  /** 当前发言者 */
  currentSpeaker: UnifiedPlayer | null;
  /** 当前发言内容 */
  streamingSpeech: {
    playerId: string;
    content: string;
  } | null;
}

/**
 * 会话状态接口
 */
export interface SessionState {
  /** 配置历史 */
  configState: ConfigHistory;
  /** 辩论状态 */
  debateState: DebateState;
  /** UI状态 */
  uiState: {
    /** 是否加载中 */
    isLoading: boolean;
    /** 是否深色模式 */
    isDarkMode: boolean;
    /** 玩家列表宽度 */
    playerListWidth: number;
  };
  /** 会话时间戳 */
  timestamp: number;
}

/**
 * 会话状态更新动作类型
 */
export type SessionAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DARK_MODE'; payload: boolean }
  | { type: 'SET_PLAYER_LIST_WIDTH'; payload: number }
  | { type: 'SET_STREAMING_SPEECH'; payload: { playerId: string; content: string; } | null }
  | { type: 'SET_CURRENT_SPEAKER'; payload: UnifiedPlayer | null }
  | { type: 'UPDATE_PLAYER'; payload: { id: string; updates: Partial<UnifiedPlayer>; } }
  | { type: 'ADD_PLAYER'; payload: UnifiedPlayer }
  | { type: 'REMOVE_PLAYER'; payload: string }
  | { type: 'SET_DEBATE_STATE'; payload: Partial<DebateState> }
  | { type: 'SET_DEBATE'; payload: DebateState }; 