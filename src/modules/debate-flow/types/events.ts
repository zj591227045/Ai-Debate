import type { Player } from '@game-config/types';
import { DebateFlowState } from './state';

export enum DebateFlowEvent {
  // 辩论状态事件
  DEBATE_STARTED = 'DEBATE_STARTED',
  DEBATE_PAUSED = 'DEBATE_PAUSED',
  DEBATE_RESUMED = 'DEBATE_RESUMED',
  DEBATE_ENDED = 'DEBATE_ENDED',
  
  // 轮次事件
  ROUND_STARTED = 'ROUND_STARTED',
  ROUND_ENDED = 'ROUND_ENDED',
  
  // 发言事件
  SPEECH_STARTED = 'SPEECH_STARTED',
  SPEECH_ENDED = 'SPEECH_ENDED',
  INNER_THOUGHTS_STARTED = 'INNER_THOUGHTS_STARTED',
  INNER_THOUGHTS_ENDED = 'INNER_THOUGHTS_ENDED',
  
  // 错误事件
  ERROR_OCCURRED = 'ERROR_OCCURRED',
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