import type { UnifiedPlayer, Speech } from '../../../types/adapters';
import type { SessionState } from './session';
import type { LLMState } from './llm';
import type { GameConfigState } from '.';

/**
 * 统一状态接口
 */
export interface UnifiedState {
  /** 游戏配置状态 */
  gameConfig: GameConfigState;
  /** 模型状态 */
  model: ModelState;
  /** 游戏规则状态 */
  gameRules: GameRulesState;
  /** 会话状态 */
  session: SessionState;
  /** LLM状态 */
  llm: LLMState;
}

/**
 * 模型状态接口
 */
export interface ModelState {
  /** 当前模型 */
  currentModel: string;
  /** 模型配置 */
  config: {
    /** 温度 */
    temperature: number;
    /** 最大令牌数 */
    maxTokens: number;
    /** 其他参数 */
    [key: string]: any;
  };
  /** 可用模型列表 */
  availableModels: Array<{
    id: string;
    name: string;
    provider: string;
    model?: string;
    parameters?: Record<string, any>;
    auth?: {
      baseUrl: string;
      apiKey: string;
    };
    isEnabled?: boolean;
    createdAt?: number;
    updatedAt?: number;
  }>;
}

/**
 * 游戏规则状态接口
 */
export interface GameRulesState {
  /** 当前规则集 */
  currentRuleSet: string;
  /** 规则配置 */
  ruleConfig: {
    /** 回合规则 */
    roundRules: Array<{
      round: number;
      format: string;
    }>;
    /** 评分规则 */
    scoringRules: Array<{
      criterion: string;
      weight: number;
    }>;
  };
  /** 自定义规则 */
  customRules: Record<string, any>;
} 