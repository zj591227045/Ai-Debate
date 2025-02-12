import { UnifiedRole } from './roles';

/**
 * 基础规则配置
 */
export interface BasicRules {
  maxLength: number;
  minLength: number;
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
  maxLength: number;
  minLength: number;
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
  format: 'structured',
  description: '标准辩论规则',
  basicRules: {
    maxLength: 1000,
    minLength: 100,
    allowEmptySpeech: false,
    allowRepeatSpeech: false
  },
  advancedRules: {
    allowQuoting: true,
    requireResponse: true,
    allowStanceChange: false,
    requireEvidence: true,
    maxLength: 2000,
    minLength: 200
  },
  roundRules: [],
  scoringRules: []
};

export interface RuleConfigProps {
  config: RuleConfig;
  onChange: (config: RuleConfig) => void;
} 