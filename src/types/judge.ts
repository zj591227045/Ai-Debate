export interface Judge {
  id: string;
  name: string;
  description?: string;
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