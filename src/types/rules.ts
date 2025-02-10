import type { RuleConfig } from '../store/unified/types';

export type { RuleConfig };

export interface BasicRules {
  speechLengthLimit: {
    min: number;
    max: number;
  };
  allowEmptySpeech: boolean;
  allowRepeatSpeech: boolean;
}

export interface AdvancedRules {
  allowQuoting: boolean;
  requireResponse: boolean;
  allowStanceChange: boolean;
  requireEvidence: boolean;
  minLength: number;
  maxLength: number;
}

export interface RuleConfigProps {
  config: RuleConfig;
  onChange: (config: RuleConfig) => void;
} 