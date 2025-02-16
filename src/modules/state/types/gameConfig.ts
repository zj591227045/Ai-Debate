import { UnifiedPlayer, BaseDebateSpeech } from '../../../types/adapters';

/**
 * 游戏配置状态接口
 */
export interface GameConfigState {
  debate: {
    topic: {
      title: string;
      description: string;
      rounds: number;
    };
    rules: {
      debateFormat: string;
      description: string;
      advancedRules: {
        speechLengthLimit: {
          min: number;
          max: number;
        };
        allowQuoting: boolean;
        requireResponse: boolean;
        allowStanceChange: boolean;
        requireEvidence: boolean;
      };
    };
    judging: {
      description: string;
      dimensions: any[];
      totalScore: number;
    };
    status?: string;
    currentRound?: number;
    currentSpeaker?: UnifiedPlayer | null;
    speeches?: BaseDebateSpeech[];
    scores?: any[];
    // 游戏配置相关属性
    format?: 'structured' | 'free';
    autoAssign?: boolean;
    minPlayers?: number;
    maxPlayers?: number;
    affirmativeCount?: number;
    negativeCount?: number;
    judgeCount?: number;
    timekeeperCount?: number;
  };
  players: UnifiedPlayer[];
  /** 是否正在配置 */
  isConfiguring: boolean;
}