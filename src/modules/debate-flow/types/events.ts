import type { Player } from '@game-config/types';
import { DebateFlowState } from './state';

export enum DebateFlowEvent {
  // 辩论状态事件
  DEBATE_STARTED = 'debate:started',
  DEBATE_PAUSED = 'debate:paused',
  DEBATE_RESUMED = 'debate:resumed',
  DEBATE_ENDED = 'debate:ended',
  
  // 轮次事件
  ROUND_STARTED = 'round:started',
  ROUND_ENDED = 'round:ended',
  ROUND_SCORED = 'round:scored',
  
  // 发言事件
  SPEECH_STARTED = 'speech:started',
  SPEECH_ENDED = 'speech:ended',
  SPEECH_STREAMING = 'speech:streaming',
  INNER_THOUGHTS_STARTED = 'INNER_THOUGHTS_STARTED',
  INNER_THOUGHTS_ENDED = 'INNER_THOUGHTS_ENDED',
  
  // 错误事件
  ERROR_OCCURRED = 'error',
  ERROR_RECOVERED = 'ERROR_RECOVERED'
}

export type EventHandler = (event: DebateFlowEvent, data: any) => void;

export interface EventEmitter {
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  off(event: string | symbol, listener: (...args: any[]) => void): this;
  emit(event: string | symbol, ...args: any[]): boolean;
}

export interface EventData {
  [DebateFlowEvent.DEBATE_STARTED]: {
    state: DebateFlowState;
  };
  [DebateFlowEvent.DEBATE_PAUSED]: {
    state: DebateFlowState;
  };
  [DebateFlowEvent.DEBATE_RESUMED]: {
    state: DebateFlowState;
  };
  [DebateFlowEvent.DEBATE_ENDED]: {
    state: DebateFlowState;
  };
  [DebateFlowEvent.ROUND_STARTED]: {
    round: number;
    state: DebateFlowState;
  };
  [DebateFlowEvent.ROUND_ENDED]: {
    round: number;
    state: DebateFlowState;
  };
  [DebateFlowEvent.ROUND_SCORED]: {
    round: number;
    state: DebateFlowState;
  };
  [DebateFlowEvent.SPEECH_STARTED]: {
    player: Player;
    type: 'speech';
    state: DebateFlowState;
  };
  [DebateFlowEvent.SPEECH_ENDED]: {
    player: Player;
    type: 'speech';
    content: string;
    state: DebateFlowState;
  };
  [DebateFlowEvent.SPEECH_STREAMING]: {
    player: Player;
    type: 'speech';
    state: DebateFlowState;
  };
  [DebateFlowEvent.INNER_THOUGHTS_STARTED]: {
    player: Player;
    type: 'innerThoughts';
    state: DebateFlowState;
  };
  [DebateFlowEvent.INNER_THOUGHTS_ENDED]: {
    player: Player;
    type: 'innerThoughts';
    content: string;
    state: DebateFlowState;
  };
  [DebateFlowEvent.ERROR_OCCURRED]: {
    error: Error;
    state: DebateFlowState;
  };
  [DebateFlowEvent.ERROR_RECOVERED]: {
    error: Error;
    state: DebateFlowState;
  };
} 