export interface RuleConfig {
  format: 'free' | 'structured';
  description: string;
  advancedRules: {
    maxLength: number;
    minLength: number;
    allowQuoting: boolean;
    requireResponse: boolean;
    allowStanceChange: boolean;
    requireEvidence: boolean;
  };
}

export interface RuleConfigProps {
  config: RuleConfig;
  onChange: (config: RuleConfig) => void;
} 