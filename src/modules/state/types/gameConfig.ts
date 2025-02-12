import type { UnifiedPlayer, Speech } from '../../../types/adapters';

/**
 * 游戏配置状态接口
 */
export interface GameConfigState {

  debate?: {
    topic: {
      title: string;
      description: string;
      rounds: number;
    };
    rules: {
      debateFormat: string;
      description: string;
      basicRules: {
        speechLengthLimit: {
          min: number;
          max: number;
        };
        allowEmptySpeech: boolean;
        allowRepeatSpeech: boolean;
      };
      advancedRules: {
        allowQuoting: boolean;
        requireResponse: boolean;
        allowStanceChange: boolean;
        requireEvidence: boolean;
      };
    };
    judging: {
      description: string;
      dimensions: Array<{
        name: string;
        weight: number;
        description: string;
        criteria: string[];
      }>;
      totalScore: number;
    };
    currentState?: {
      status: 'preparing' | 'ongoing' | 'paused' | 'finished';
      currentRound: number;
      currentSpeaker?: string;
    };
    players?: Record<string, UnifiedPlayer>;
    speeches?: Speech[];
  };
  players?: UnifiedPlayer[];
  /** 是否正在配置 */
  isConfiguring: boolean;
}