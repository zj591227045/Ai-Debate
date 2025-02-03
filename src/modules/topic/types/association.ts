import { BaseEntity } from '../../storage/validation/schemas/base.schema';
import { TopicType } from './index';
import { DebateFormat } from '../../rules/types';

// 类型匹配验证结果
export interface TypeValidation {
  isTypeMatched: boolean;  // 类型是否匹配
  matchDetails: {
    topicType: TopicType;  // 主题类型
    ruleFormat: DebateFormat; // 规则格式
  };
}

// 主题-规则关联
export interface TopicRuleAssociation extends BaseEntity {
  topicId: string;         // 主题ID
  ruleId: string;          // 规则ID
  isDefault: boolean;      // 是否为该主题的默认规则
  typeValidation: TypeValidation; // 类型匹配验证
}

// 创建关联参数
export type CreateAssociationParams = Omit<TopicRuleAssociation, keyof BaseEntity>;

// 更新关联参数
export type UpdateAssociationParams = Partial<CreateAssociationParams>;

// 关联验证错误
export interface AssociationValidationError {
  field: keyof TopicRuleAssociation;
  message: string;
}

// 关联查询过滤器
export interface AssociationFilter {
  topicId?: string;
  ruleId?: string;
  isDefault?: boolean;
  isMatched?: boolean;
}

// 关联查询结果
export interface AssociationQueryResult {
  total: number;
  items: TopicRuleAssociation[];
} 