import { z } from 'zod';
import { baseEntitySchema, nameSchema, descriptionSchema, urlSchema } from '../base.schema';

// 人设配置验证模式
export const personaSchema = z.object({
  personality: z.array(z.string()).min(1, '至少选择一个性格特征'),
  speakingStyle: z.string().min(1, '说话风格不能为空'),
  background: z.string().min(1, '专业背景不能为空'),
  values: z.array(z.string()).min(1, '至少选择一个价值观'),
  argumentationStyle: z.array(z.string()).min(1, '至少选择一个论证风格'),
  customDescription: z.string().optional(),
});

// 调用配置验证模式
export const callConfigSchema = z.object({
  type: z.enum(['dify', 'direct']),
  dify: z.object({
    serverUrl: z.string(),
    apiKey: z.string(),
  }).optional(),
  direct: z.object({
    provider: z.string(),
    modelId: z.string(),
    model: z.string(),
  }).optional(),
});

// 角色配置存储验证模式
export const characterStorageSchema = baseEntitySchema.extend({
  name: z.string().min(1, '角色名称不能为空'),
  avatar: z.string().optional(),
  description: z.string().optional(),
  persona: personaSchema,
  callConfig: callConfigSchema,
  isTemplate: z.literal(true).or(z.literal(false)),
  templateId: z.string().optional(),
});

// 角色配置验证模式
export const characterConfigSchema = baseEntitySchema.extend({
  name: nameSchema,
  avatar: urlSchema.optional(),
  description: descriptionSchema.optional(),
  persona: personaSchema,
  callConfig: callConfigSchema,
  isTemplate: z.boolean().optional(),
  templateId: z.string().optional(),
});

// 模型参数验证模式
export const modelParametersSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().min(1).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
});

// 模型配置验证模式
export const modelConfigSchema = z.object({
  modelId: z.string().min(1, '模型ID不能为空'),
  provider: z.string().min(1, '供应商不能为空'),
  parameters: modelParametersSchema.optional(),
});

// 角色模板验证模式
export const characterTemplateSchema = baseEntitySchema.extend({
  name: nameSchema,
  description: descriptionSchema,
  persona: personaSchema,
  modelConfig: modelConfigSchema.optional(),
  callConfig: z.object({
    type: z.enum(['dify', 'direct']),
    dify: z.object({
      serverUrl: z.string(),
      apiKey: z.string(),
    }).optional(),
    direct: z.object({
      modelId: z.string(),
    }).optional(),
  }),
});

// 导出类型
export type CharacterProfile = z.infer<typeof characterConfigSchema>;
export type CharacterTemplate = z.infer<typeof characterTemplateSchema>;
export type Persona = z.infer<typeof personaSchema>;
export type ModelConfig = z.infer<typeof modelConfigSchema>;
export type ModelParameters = z.infer<typeof modelParametersSchema>;
export type CharacterStorage = z.infer<typeof characterStorageSchema>; 