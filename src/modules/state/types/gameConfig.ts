import type { UnifiedPlayer, Speech } from '../../../types/adapters';

/**
 * 游戏配置状态接口
 */
export interface GameConfigState {
  /** 主题配置 */
  topic: {
    /** 标题 */
    title: string;
    /** 描述 */
    description: string;
    /** 背景 */
    background: string;
  };
  /** 规则配置 */
  rules: {
    /** 总回合数 */
    totalRounds: number;
    /** 辩论格式 */
    format: 'structured' | 'free';
  };
  /** 玩家列表 */
  players: UnifiedPlayer[];
  /** 规则配置 */
  ruleConfig: Record<string, any>;
  /** 辩论配置 */
  debate?: {
    topic: {
      title: string;
      description: string;
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
  /** 是否正在配置 */
  isConfiguring: boolean;
}