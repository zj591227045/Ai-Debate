// 辩论类型
export type DebateType = 'binary' | 'multi';

// 基础实体类型
interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

// 主题配置
export interface TopicConfig extends BaseEntity {
  title: string;          // 辩题
  description: string;    // 主题描述
  background?: string;    // 背景资料（可选）
  type: DebateType;      // 辩论类型
}

// 演讲规则
export interface SpeechRules {
  maxLength: number;   // 最大字数
  minLength: number;   // 最小字数
  timeLimit?: number;  // 时间限制（秒）
}

// 规则配置
export interface RulesConfig extends BaseEntity {
  name: string;         // 规则名称
  format: DebateType;   // 辩论形式（必须与主题类型匹配）
  speechRules: SpeechRules;
  isDefault?: boolean;  // 是否为默认规则
}

// 辩论模板
export interface DebateTemplate extends BaseEntity {
  name: string;
  content: {
    topic: TopicConfig;
    rules: RulesConfig;
  };
}

// 模板创建参数
export type CreateTemplateParams = Omit<DebateTemplate, 'id' | 'createdAt' | 'updatedAt'>;

// 模板更新参数
export type UpdateTemplateParams = Partial<CreateTemplateParams>; 