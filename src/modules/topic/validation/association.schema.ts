import { z } from 'zod';
import { baseEntitySchema } from '../../storage/validation/schemas/base.schema';
import { topicSchema } from './schemas';
import { rulesSchema } from '../../rules/validation/schemas';
import { TopicType } from '../types';
import { DebateFormat } from '../../rules/types';

// 类型匹配验证结果验证模式
const typeValidationSchema = z.object({
  isTypeMatched: z.boolean(),
  matchDetails: z.object({
    topicType: z.enum(['policy', 'value', 'fact'] as const),
    ruleFormat: z.enum(['structured', 'free'] as const),
  }),
});

// 主题-规则关联基础验证模式
const associationBaseSchema = z.object({
  topicId: z.string().min(1, '主题ID不能为空'),
  ruleId: z.string().min(1, '规则ID不能为空'),
  isDefault: z.boolean(),
  typeValidation: typeValidationSchema,
});

// 主题-规则关联验证模式
export const associationSchema = baseEntitySchema.merge(associationBaseSchema);

// 创建关联验证模式
export const createAssociationSchema = associationBaseSchema;

// 更新关联验证模式
export const updateAssociationSchema = associationBaseSchema.partial();

// 类型匹配验证函数
export const validateTypeMatch = (topicType: TopicType, ruleFormat: DebateFormat): boolean => {
  // 根据业务规则定义类型匹配逻辑
  const matchRules: Record<TopicType, DebateFormat[]> = {
    policy: ['structured'],
    value: ['structured', 'free'],
    fact: ['structured'],
  };

  return matchRules[topicType]?.includes(ruleFormat) || false;
}; 