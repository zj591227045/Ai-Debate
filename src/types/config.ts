import { TopicConfig, RuleConfig, DebateConfig } from '../store/unified/types';
import { DebateRole } from './player';

export interface GameConfigState {
  settings: {
    roundCount: number;
    timeLimit: number;
    language: string;
    dify?: {
      serverUrl: string;
      apiKey: string;
      workflowId: string;
      parameters: Record<string, any>;
    };
    direct?: {
      provider: string;
      apiKey: string;
      model: string;
      parameters: Record<string, any>;
    };
  };
  roles: {
    affirmative: string[];
    negative: string[];
  };
  topic: TopicConfig;
  rules: RuleConfig;
  debate: DebateConfig;
  players: Array<{
    id: string;
    name: string;
    isAI: boolean;
    role: DebateRole;
    characterId?: string;
  }>;
  ruleConfig: RuleConfig;
  isConfiguring: boolean;
}