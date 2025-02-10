import type { ModelConfig } from '../modules/model/types';

export interface Judge {
  id: string;
  name: string;
  avatar?: string;
  modelConfig?: ModelConfig;
  description?: string;
  capabilities?: {
    scoring: boolean;
    feedback: boolean;
    realtime: boolean;
  };
  status?: 'active' | 'inactive';
}

export interface JudgingCriteria {
  id: string;
  name: string;
  weight: number;
  description: string;
  criteria: string[];
}

export interface JudgingConfig {
  description: string;
  dimensions: JudgingCriteria[];
  totalScore: number;
  selectedJudge?: Judge;
}

export type DimensionType = 'logic' | 'humanness' | 'compliance';

export interface DimensionScores {
  logic: number;
  humanness: number;
  compliance: number;
}

export interface CustomScoreRule {
  id: string;
  name: string;
  score: number;
}

export interface JudgeConfigState {
  selectedJudgeId: string;
  scoringRule: string;
  dimensionScores: DimensionScores;
  customScoreRules: CustomScoreRule[];
} 