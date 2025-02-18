import type { Player } from '@game-config/types';
import type { Speech, SpeakerStatus, SpeakerInfo } from './interfaces';
import { DebateStatus } from '../../state/types/adapters';

export interface DebateFlowState {
  // 基础状态
  status: DebateStatus;
  currentRound: number;
  totalRounds: number;
  
  // 发言相关
  speakingOrder: SpeakingOrder;
  currentSpeaker: SpeakerInfo | null;
  nextSpeaker: SpeakerInfo | null;
  
  // 当前发言状态
  currentSpeech: {
    type: 'innerThoughts' | 'speech';
    content: string;
    status: 'streaming' | 'completed' | 'failed';
  } | null;

  // 内部状态控制
  _forceUpdate?: number;
  _timestamp?: number;
}

export interface SpeakingOrder {
  format: 'free' | 'structured';
  currentRound: number;
  totalRounds: number;
  speakers: Array<{
    player: SpeakerInfo;
    status: SpeakerStatus;
    sequence: number;
  }>;
  history: Array<{
    round: number;
    speakerId: string;
  }>;
} 