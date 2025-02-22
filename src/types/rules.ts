import { UnifiedRole } from './roles';

/**
 * 基础规则配置
 */
export interface BasicRules {
  speechLengthLimit: {
    min: number;
    max: number;
  }
  allowEmptySpeech: boolean;
  allowRepeatSpeech: boolean;
}

/**
 * 高级规则配置
 */
export interface AdvancedRules {
  allowQuoting: boolean;
  requireResponse: boolean;
  allowStanceChange: boolean;
  requireEvidence: boolean;
  speechLengthLimit: {
    min: number;
    max: number;
  }
}

/**
 * 回合规则配置
 */
export interface RoundRules {
  round: number;
  format: string;
  allowedRoles: UnifiedRole[];
}

/**
 * 评分规则配置
 */
export interface ScoringRules {
  criterion: string;
  weight: number;
  description: string;
  minScore: number;
  maxScore: number;
}

/**
 * 规则配置
 */
export interface RuleConfig {
  debateFormat: 'structured' | 'free' | 'tournament';
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
  roundRules: any[];
  scoringRules: any[];
}

/**
 * 默认规则配置
 */
export const DEFAULT_RULE_CONFIG: RuleConfig = {
  debateFormat: 'free',
  description: '',
  advancedRules: {
    allowQuoting: true,
    requireResponse: true,
    allowStanceChange: false,
    requireEvidence: true,
    speechLengthLimit: {
      min: 100,
      max: 1000
    }
  },
  roundRules: [],
  scoringRules: []
};

export interface RuleConfigProps {
  config: RuleConfig;
  onChange: (config: RuleConfig) => void;
} 