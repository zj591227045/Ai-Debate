export * from './state';
export * from './events';
export * from './errors';
export * from './controller';
export * from './manager';

export interface ProcessedSpeech {
  id: string;
  content: string;
  timestamp: number;
  round: number;
  type: 'speech' | 'innerThoughts';
  playerId: string;
  playerName: string;
  metadata: {
    wordCount: number;
    [key: string]: any;
  };
}

export interface JudgeConfig {
  id: string;
  name: string;
  role: 'judge';
  systemPrompt: string;
  outputFormat: string;
}

export interface ScoringDimension {
  name: string;
  weight: number;
  description: string;
  criteria: string[];
}

export interface ScoringRules {
  dimensions: ScoringDimension[];
}

export interface Score {
  id: string;
  playerId: string;
  round: number;
  timestamp: number;
  dimensions: Record<string, number>;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  comment: string;
  totalScore: number;
}

export interface ScoringContext {
  judge: JudgeConfig;
  rules: ScoringRules;
  previousScores: Score[];
} 