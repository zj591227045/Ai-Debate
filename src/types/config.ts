import type { DebateConfig } from './debate';
import type { Player } from './player';
import type { RuleConfig } from './rules';

export interface GameConfigState {
  topic: {
    title: string;
    description: string;
  };
  rules: {
    totalRounds: number;
    debateFormat: string;
  };
  debate: DebateConfig;
  players: Player[];
  ruleConfig: RuleConfig;
  isConfiguring: boolean;
} 