import type { DebateConfig } from './debate';
import type { Player } from './player';
import type { RuleConfig } from './rules';

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
      dimensions: any[];
      totalScore: number;
    };
  };
  players: any[];
  isConfiguring: boolean;
}

// 其他配置相关的类型定义
export interface ConfigHistory {
  activeConfig: GameConfigState;
  savedConfigs: GameConfigState[];
  lastModified: number;
}

export interface ConfigValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ConfigMetadata {
  version: string;
  createdAt: number;
  updatedAt: number;
  author?: string;
  description?: string;
  tags?: string[];
} 