import type { Player } from '@game-config/types';
import type { Speech } from '@debate/types';

export type SpeakerStatus = 'pending' | 'speaking' | 'completed' | 'skipped';

export interface DebateFlowState {
  // 基础状态
  status: 'preparing' | 'ongoing' | 'paused' | 'completed';
  currentRound: number;
  totalRounds: number;
  
  // 发言相关
  speakingOrder: SpeakingOrder;
  currentSpeaker: Player | null;
  nextSpeaker: Player | null;
  
  // 当前发言状态
  currentSpeech: {
    type: 'innerThoughts' | 'speech';
    content: string;
    status: 'streaming' | 'completed' | 'failed';
  } | null;
}

export interface SpeakingOrder {
  format: 'free' | 'structured';
  currentRound: number;
  totalRounds: number;
  speakers: Array<{
    player: Player;
    status: SpeakerStatus;
    sequence: number;
  }>;
  history: Array<{
    round: number;
    speakerId: string;
  }>;
} 