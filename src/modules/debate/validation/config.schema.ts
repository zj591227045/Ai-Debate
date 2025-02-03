import { z } from 'zod';

// 主题配置验证模式
export const topicConfigSchema = z.object({
  title: z.string().min(1, '辩题不能为空'),
  background: z.string().min(1, '主题背景不能为空'),
});

// 规则配置验证模式
export const ruleConfigSchema = z.object({
  format: z.enum(['structured', 'free']),
  description: z.string().min(1, '规则说明不能为空'),
  advancedRules: z.object({
    maxLength: z.number().min(1, '最大字数必须大于0'),
    minLength: z.number().min(0, '最小字数不能为负数'),
    allowQuoting: z.boolean(),
    requireResponse: z.boolean(),
    allowStanceChange: z.boolean(),
    requireEvidence: z.boolean(),
  }),
});

// 配置模板验证模式
export const configTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, '模板名称不能为空'),
  topic: topicConfigSchema,
  rules: ruleConfigSchema,
});

// 导出类型
export type TopicConfig = z.infer<typeof topicConfigSchema>;
export type RuleConfig = z.infer<typeof ruleConfigSchema>;
export type ConfigTemplate = z.infer<typeof configTemplateSchema>; 