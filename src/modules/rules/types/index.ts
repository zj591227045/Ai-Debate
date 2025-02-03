import { BaseEntity } from '../../storage/validation/schemas/base.schema';

// 辩论形式
export type DebateFormat = 'structured' | 'free';

// 基础规则
export interface BasicRules {
  maxLength: number;       // 最大字数
  minLength: number;       // 最小字数
  allowEmpty: boolean;     // 允许空发言
  allowRepeat: boolean;    // 允许重复发言
  timeLimit?: number;      // 时间限制（秒）
}

// 高级规则
export interface AdvancedRules {
  allowQuoting: boolean;      // 允许引用
  requireResponse: boolean;   // 必须回应前一个观点
  allowStanceChange: boolean; // 允许改变立场
  requireEvidence: boolean;   // 要求提供论据
  argumentTypes: string[];    // 允许的论证类型
}

// 评分维度
export interface ScoringDimension {
  weight: number;     // 权重 (0-100)
  criteria: string[]; // 评分标准
}

// 评分规则
export interface ScoringRules {
  dimensions: {
    logic: ScoringDimension;        // 逻辑性
    naturalness: ScoringDimension;  // 人类自然度
    compliance: ScoringDimension;   // 规则遵守度
    consistency: ScoringDimension;  // 立场一致性
    responsiveness: ScoringDimension; // 反应能力
  };
  bonusPoints: {
    innovation: number;      // 创新性
    persuasiveness: number;  // 说服力
    clarity: number;         // 表达清晰度
  };
}

// 规则配置
export interface Rules extends BaseEntity {
  name: string;              // 规则集名称
  description?: string;      // 规则说明
  format: DebateFormat;      // 辩论形式
  speechRules: BasicRules;   // 基础规则
  advancedRules: AdvancedRules; // 高级规则
  scoring: ScoringRules;     // 评分规则
  isDefault?: boolean;       // 是否为默认规则集
  version: string;           // 规则版本号
}

// 创建规则参数
export type CreateRulesParams = Omit<Rules, keyof BaseEntity>;

// 更新规则参数
export type UpdateRulesParams = Partial<CreateRulesParams>;

// 规则验证错误
export interface RulesValidationError {
  field: keyof Rules | string;
  message: string;
}

// 规则表单状态
export interface RulesFormState {
  rules: CreateRulesParams;
  errors: RulesValidationError[];
  isDirty: boolean;
  isSubmitting: boolean;
} 