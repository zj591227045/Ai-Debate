import { z } from 'zod';
import { DebateType } from '../types/debate';

// 辩论类型验证
export const DebateTypeSchema = z.enum(['binary', 'multi']);

// 基础实体验证
const BaseEntitySchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// 演讲规则验证
export const SpeechRulesSchema = z.object({
  maxLength: z.number().int().positive(),
  minLength: z.number().int().positive(),
  timeLimit: z.number().int().positive().optional(),
}).refine(data => data.maxLength > data.minLength, {
  message: "最大字数必须大于最小字数"
});

// 主题配置验证
export const TopicConfigSchema = BaseEntitySchema.extend({
  title: z.string().min(4).max(100),
  description: z.string().min(10).max(500),
  background: z.string().max(2000).optional(),
  type: DebateTypeSchema
});

// 规则配置验证
export const RulesConfigSchema = BaseEntitySchema.extend({
  name: z.string().min(3).max(50),
  format: DebateTypeSchema,
  speechRules: SpeechRulesSchema,
  isDefault: z.boolean().optional(),
});

// 模板内容验证
export const TemplateContentSchema = z.object({
  topic: TopicConfigSchema,
  rules: RulesConfigSchema
}).refine(data => data.topic.type === data.rules.format, {
  message: "主题类型必须与规则格式匹配"
});

// 创建模板参数验证
export const CreateTemplateSchema = z.object({
  name: z.string().min(3).max(50),
  content: TemplateContentSchema
});

// 更新模板参数验证
export const UpdateTemplateSchema = CreateTemplateSchema.partial();

// 完整模板验证
export const DebateTemplateSchema = BaseEntitySchema.extend({
  name: z.string().min(3).max(50),
  content: TemplateContentSchema
}); 