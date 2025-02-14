import type { CharacterConfig } from '../../character/types';

export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  characterId?: string;
  role: string;
  team?: 'affirmative' | 'negative';
  personality?: string;
  speakingStyle?: string;
  background?: string;
  values?: string;
  argumentationStyle?: string;
}

export interface DebateConfig {
  topic: {
    title: string;
    description: string;
    rounds: number;
  };
  players: Player[];
  rules: {
    canSkipSpeaker: boolean;
    requireInnerThoughts: boolean;
    debateFormat: 'structured' | 'free';
  };
  judge?: {
    id: string;
    name: string;
    characterId: string;
  };
} 