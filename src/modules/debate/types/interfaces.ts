export interface BaseDebateSpeech {
  id: string;
  playerId: string;
  content: string;
  type: string;
  timestamp: string;
  round: number;
  role: string;
  references?: string[];
}

export interface BaseDebateScore {
  id: string;
  speechId: string;
  playerId: string;
  round: number;
  totalScore: number;
  dimensions: {
    [key: string]: number;
  };
  comment?: string;
  timestamp: string;
}

export interface ScoringDimension {
  name: string;
  weight: number;
  description: string;
  criteria: string[];
} 