import type { Judge } from './judge';

export interface Topic {
  title: string;
  description: string;
  background?: string;
  type: 'structured' | 'free';
}

export interface Rules {
  debateFormat: 'structured' | 'free';
  basicRules: {
    speechLengthLimit: {
      min: number;
      max: number;
      defaultMax: number;
    };
    totalRounds: number;
    allowEmptySpeech: boolean;
    allowRepeatSpeech: boolean;
  };
  roundRules: {
    drawMethod: 'random';
    orderLocked: boolean;
    speakOncePerRound: boolean;
  };
  eliminationRules?: {
    enabled: boolean;
    eliminatePerRound: number;
    minPlayers: number;
    tiebreaker: {
      criteria: ('averageScore' | 'totalScore' | 'innovation' | 'logic')[];
      random: boolean;
    };
  };
}

export interface Participants {
  totalCount: number;
  userParticipation: {
    isParticipating: boolean;
    role?: string;
  };
  aiPlayers: {
    playerId: string;
    role?: string;
    team?: number;
  }[];
  teamSetup?: {
    teamCount: number;
    playersPerTeam: number;
  };
}

export interface ScoringCriteria {
  id: string;
  name: string;
  description: string;
  type: string;
  weight: number;
  scoringGuide: string;
  enabledInModes: ('ai_judge' | 'group_review')[];
}

export interface DebateConfig {
  id?: string;
  // 主题配置
  topic: {
    title: string;
    description: string;
    rounds: number;
  };
  // 规则配置
  rules: {
    debateFormat: 'structured' | 'free' | 'tournament';
    description: string;
    advancedRules: {
      speechLengthLimit: {
        min: number;
        max: number;
      };
      allowQuoting: boolean;
      requireResponse: boolean;
      allowStanceChange: boolean;
      requireEvidence: boolean;
    };
  };
  // 裁判配置
  judging: {
    description: string;
    dimensions: Array<{
      id: string;
      name: string;
      weight: number;
      description: string;
      criteria: string[];
    }>;
    totalScore: number;
    type?: 'ai' | 'human' | 'hybrid';
    selectedJudge?: Judge & { modelConfig?: any };
    scoreRange?: {
      min: number;
      max: number;
    };
  };
  // 参与者配置
  participants?: Participants;
  // 元数据
  createdAt?: Date;
  updatedAt?: Date;
} 