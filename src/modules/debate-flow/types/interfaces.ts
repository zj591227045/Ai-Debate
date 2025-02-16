import type { EventEmitter } from 'events';
import type { Player } from '../../game-config/types';

export const DebateStatus = {
  PREPARING: 'preparing',
  ONGOING: 'ongoing',
  PAUSED: 'paused',
  ROUND_COMPLETE: 'roundComplete',
  SCORING: 'scoring',
  COMPLETED: 'completed'
} as const;

export type DebateStatus = typeof DebateStatus[keyof typeof DebateStatus];

// 核心接口定义
export interface IDebateFlow {
  initialize(config: DebateFlowConfig): Promise<void>;
  startDebate(): Promise<void>;
  pauseDebate(): Promise<void>;
  resumeDebate(): Promise<void>;
  endDebate(): Promise<void>;
  submitSpeech(speech: SpeechInput): Promise<void>;
  getCurrentState(): DebateFlowState;
  subscribeToStateChange(handler: StateChangeHandler): () => void;
  skipCurrentSpeaker(): Promise<void>;
  handlePlayerExit(playerId: string): Promise<void>;
  handlePlayerRejoin(player: PlayerConfig): Promise<void>;
  startScoring(): Promise<void>;
  startNextRound(): Promise<void>;
}

// 配置相关接口
export interface DebateFlowConfig {
  topic: {
    title: string;
    description?: string;
    background?: string;
    rounds: number;
  };
  players: PlayerConfig[];
  rules: DebateRules;
  judge?: JudgeConfig;
}

export interface PlayerConfig {
  id: string;
  name: string;
  isAI: boolean;
  role: string;
  team?: 'affirmative' | 'negative';
  characterConfig?: CharacterConfig;
}

export interface CharacterConfig {
  id: string;
  personality?: string;
  speakingStyle?: string;
  background?: string;
  values?: string[];
  argumentationStyle?: string;
}

export interface JudgeConfig {
  id: string;
  name: string;
  characterConfig?: CharacterConfig;
}

export interface DebateRules {
  format: 'free' | 'structured';
  rounds: number;
  timeLimit?: number;
  canSkipSpeaker: boolean;
  requireInnerThoughts: boolean;
}

// 状态相关接口
export interface DebateFlowState {
  status: DebateStatus;
  currentRound: number;
  totalRounds: number;
  currentSpeaker: SpeakerInfo | null;
  nextSpeaker: SpeakerInfo | null;
  speakingOrder: SpeakingOrder;
  currentSpeech: {
    type: 'innerThoughts' | 'speech';
    content: string;
    status: 'streaming' | 'completed' | 'failed';
  } | null;
  speeches: Speech[];
  scores: Score[];
}

export interface SpeakerInfo extends Player {
  id: string;
  name: string;
  role: string;
  isAI: boolean;
  team?: 'affirmative' | 'negative';
}

export type SpeakerStatus = 'waiting' | 'speaking' | 'finished';

export type SpeakingOrderInfo = {
  format: 'free' | 'structured';
  currentRound: number;
  totalRounds: number;
  speakers: Array<{
    player: SpeakerInfo;
    status: SpeakerStatus;
    sequence: number;
  }>;
  history: Array<{
    round: number;
    speakerId: string;
  }>;
};

export type SpeakingOrder = SpeakingOrderInfo;

// 输入输出相关接口
export type SpeechRole = 'assistant' | 'user' | 'system';
export type SpeechType = 'speech' | 'innerThoughts' | 'system';

export interface SpeechInput {
  playerId: string;
  content: string;
  type: 'speech' | 'innerThoughts' | 'system';
  references?: string[];
  role?: 'assistant' | 'user' | 'system';
  timestamp?: number | string;
  round?: number;
  id?: string;
}

export interface Speech {
  id: string;
  playerId: string;
  content: string;
  type: SpeechType;
  timestamp: number;
  round: number;
  role: SpeechRole;
}

export interface SpeechInfo {
  type: 'innerThoughts' | 'speech';
  content: string;
  status: 'streaming' | 'completed' | 'failed';
}

export type StateChangeHandler = (state: DebateFlowState) => void;

export interface GenerateStreamOptions {
  characterId: string;
  type: 'innerThoughts' | 'speech';
  signal?: AbortSignal;
  systemPrompt?: string;
  humanPrompt?: string;
}

export interface DebateContext {
  topic: {
    title: string;
    background?: string;
  };
  currentRound: number;
  totalRounds: number;
  previousSpeeches: Speech[];
}

// 服务接口
export interface ILLMService {
  generateStream(options: {
    systemPrompt: string;
    humanPrompt?: string;
    characterId?: string;
    type?: 'innerThoughts' | 'speech';
    signal?: AbortSignal;
  }): AsyncGenerator<string>;
  
  generateInnerThoughts(
    player: Player,
    context: DebateContext,
    options?: Partial<GenerateStreamOptions>
  ): AsyncGenerator<string>;
  
  generateSpeech(
    player: Player,
    context: DebateContext,
    innerThoughts: string,
    options?: Partial<GenerateStreamOptions>
  ): AsyncGenerator<string>;
  
  generateScore(
    speech: ProcessedSpeech,
    context: ScoringContext
  ): AsyncGenerator<string>;
}

export interface ISpeechProcessor {
  processSpeech(speech: SpeechInput, context: SpeechContext): Promise<ProcessedSpeech>;
}

export interface SpeechContext {
  currentRound: number;
  previousSpeeches: ProcessedSpeech[];
  speaker: SpeakerInfo;
}

export interface ProcessedSpeech extends SpeechInput {
  id: string;
  round: number;
  timestamp: number;
  metadata: {
    wordCount: number;
  };
}

export interface IScoringSystem {
  generateScore(speech: ProcessedSpeech, context: ScoringContext): Promise<Score>;
  getScoreStatistics(): ScoreStatistics;
  getPlayerRankings(): PlayerRanking[];
}

export interface ScoringContext {
  judge: JudgeConfig;
  rules: ScoringRules;
  previousScores: Score[];
}

export interface ScoringRules {
  dimensions: Array<{
    name: string;
    weight: number;
    description: string;
    criteria: string[];
  }>;
}

export interface Score {
  id: string;
  speechId: string;
  judgeId: string;
  playerId: string;
  round: number;
  timestamp: number;
  dimensions: Record<string, number>;
  totalScore: number;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  comment: string;
}

export interface ScoreStatistics {
  dimensions: Record<string, DimensionStats>;
  overall: {
    average: number;
    highest: number;
    lowest: number;
    distribution: Record<string, number>;
  };
}

export interface DimensionStats {
  average: number;
  highest: number;
  lowest: number;
  distribution: Record<string, number>;
}

export interface PlayerRanking {
  playerId: string;
  totalScore: number;
  averageScore: number;
  dimensionScores: Record<string, number>;
  speechCount: number;
  rank: number;
} 