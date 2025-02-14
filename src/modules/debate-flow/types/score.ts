export interface Score {
  id: string;
  judgeId: string;
  playerId: string;
  speechId: string;
  round: number;
  timestamp: number;
  dimensions: Record<string, number>;
  totalScore: number;
  comment: string;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
}

export interface Judge {
  id: string;
  name: string;
  introduction?: string;
  personality?: string;
  speakingStyle?: string;
  background?: string;
  values?: string[];
  argumentationStyle?: string;
}

export interface GameConfig {
  topic: {
    title: string;
    description: string;
  };
  debate: {
    judging: {
      description: string;
      dimensions: Array<{
        name: string;
        weight: number;
        description: string;
        criteria: string[];
      }>;
    };
  };
} 