import { z } from 'zod';
import { baseEntitySchema, nameSchema, descriptionSchema } from '../base.schema';

// 基础规则验证模式
const basicRulesSchema = z.object({
  maxLength: z.number().int().min(1, '最大字数必须大于0'),
  minLength: z.number().int().min(0, '最小字数不能为负数'),
  allowEmpty: z.boolean(),
  allowRepeat: z.boolean(),
});

// 高级规则验证模式
const advancedRulesSchema = z.object({
  allowQuoting: z.boolean(),
  requireResponse: z.boolean(),
  allowStanceChange: z.boolean(),
  requireEvidence: z.boolean(),
  argumentTypes: z.array(z.string()).min(1, '至少需要一种论证类型'),
});

// 评分维度验证模式
const scoringDimensionSchema = z.object({
  weight: z.number().min(0, '权重不能为负数').max(100, '权重不能超过100'),
  criteria: z.array(z.string()).min(1, '至少需要一个评分标准'),
});

// 评分规则验证模式
const scoringSchema = z.object({
  dimensions: z.object({
    logic: scoringDimensionSchema,
    naturalness: scoringDimensionSchema,
    compliance: scoringDimensionSchema,
    consistency: scoringDimensionSchema,
    responsiveness: scoringDimensionSchema,
  }),
  bonusPoints: z.object({
    innovation: z.number().min(0, '加分不能为负数'),
    persuasiveness: z.number().min(0, '加分不能为负数'),
    clarity: z.number().min(0, '加分不能为负数'),
  }),
});

// 游戏规则验证模式
export const gameRulesSchema = baseEntitySchema.extend({
  name: nameSchema,
  description: descriptionSchema,
  topic: z.object({
    title: z.string().min(1, '辩题不能为空'),
    description: z.string().min(1, '主题说明不能为空'),
    background: z.string().optional(),
  }),
  rules: z.object({
    format: z.enum(['structured', 'free']),
    speechRules: basicRulesSchema,
    advancedRules: advancedRulesSchema,
  }),
  scoring: scoringSchema,
  isDefault: z.boolean().optional(),
  version: z.string().min(1, '版本号不能为空'),
});

// 导出类型
export type GameRules = z.infer<typeof gameRulesSchema>;
export type BasicRules = z.infer<typeof basicRulesSchema>;
export type AdvancedRules = z.infer<typeof advancedRulesSchema>;
export type ScoringRules = z.infer<typeof scoringSchema>; 