import { z } from 'zod';
import { baseEntitySchema } from '../../storage/validation/schemas/base.schema';
import { DebateFormat } from '../types';

// 辩论形式验证
const debateFormatSchema = z.enum(['structured', 'free'] as const);

// 基础规则验证模式
const basicRulesSchema = z.object({
  maxLength: z.number().int().min(1, '最大字数必须大于0'),
  minLength: z.number().int().min(0, '最小字数不能为负数'),
  allowEmpty: z.boolean(),
  allowRepeat: z.boolean(),
  timeLimit: z.number().int().min(30, '时间限制不能少于30秒').optional(),
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
const scoringRulesSchema = z.object({
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

// 规则验证模式
export const rulesSchema = baseEntitySchema.extend({
  name: z.string().min(2, '规则名称至少需要2个字符').max(50, '规则名称最多50个字符'),
  description: z.string().min(10, '规则说明至少需要10个字符').max(500, '规则说明最多500个字符').optional(),
  format: debateFormatSchema,
  speechRules: basicRulesSchema,
  advancedRules: advancedRulesSchema,
  scoring: scoringRulesSchema,
  isDefault: z.boolean().optional(),
  version: z.string().min(1, '版本号不能为空'),
});

// 创建规则验证模式
export const createRulesSchema = rulesSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// 更新规则验证模式
export const updateRulesSchema = createRulesSchema.partial(); 