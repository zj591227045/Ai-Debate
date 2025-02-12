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
  format: 'structured' | 'free';
  description: string;
  basicRules: BasicRules;
  advancedRules: AdvancedRules;
  roundRules: RoundRules[];
  scoringRules: ScoringRules[];
}

/**
 * 默认规则配置
 */
export const DEFAULT_RULE_CONFIG: RuleConfig = {
  format: 'free',
  description: '',
  basicRules: {
    speechLengthLimit: {
      min: 100,
      max: 1000
    },
    allowEmptySpeech: false,
    allowRepeatSpeech: false
  },
  advancedRules: {
    allowQuoting: true,
    requireResponse: true,
    allowStanceChange: false,
    requireEvidence: true,
    speechLengthLimit: {
      min: 200,
      max: 2000
    }
  },
  roundRules: [],
  scoringRules: []
};

export interface RuleConfigProps {
  config: RuleConfig;
  onChange: (config: RuleConfig) => void;
} 