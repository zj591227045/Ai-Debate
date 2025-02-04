import type { DebateConfig } from './debate';
import type { Player } from './player';
import type { RuleConfig } from './rules';

export interface GameConfigState {
  debate: DebateConfig;
  players: Player[];
  ruleConfig: RuleConfig;
  isConfiguring: boolean;
} 