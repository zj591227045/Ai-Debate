export interface Speech {
  id: string;
  content: string;
  round: number;
  playerId: string;
  player?: {
    id: string;
    name: string;
  };
  team?: 'affirmative' | 'negative';
} 