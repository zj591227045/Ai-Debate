import { Character } from './character';

export interface Speech {
  playerId: string;
  content: string;
  round: number;
  timestamp: string;
  references?: string[];
}

export interface Score {
  judgeId: string;
  content: string;
  round: number;
  timestamp: string;
}

export interface DebateState {
  topic: {
    title: string;
    background: string;
  };
  currentRound: number;
  totalRounds: number;
  players: Character[];
  currentSpeakerId?: string;
  speeches: Speech[];
  scores: Score[];
  innerThoughts: Record<string, string>;
  status: 'preparing' | 'ongoing' | 'paused' | 'finished';
}

export interface DebateRoomProps {
  state: DebateState;
  onStateChange: (newState: DebateState) => void;
} 