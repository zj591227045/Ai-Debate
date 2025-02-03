import { z } from 'zod';
import { baseEntitySchema, BaseEntity } from './base.schema';

// 模型参数验证模式
export const modelParametersSchema = z.object({
  temperature: z.number().min(0).max(2),
  topP: z.number().min(0).max(1),
  maxTokens: z.number().min(1).max(32000),
  presencePenalty: z.number().min(-2).max(2).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  stop: z.array(z.string()).optional(),
  seed: z.number().optional(),
});

// 认证配置验证模式
export const authConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
  organizationId: z.string().optional(),
});

// 模型配置验证模式
export const modelConfigSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  description: z.string().optional(),
  provider: z.string(),
  model: z.string(),
  parameters: modelParametersSchema,
  auth: authConfigSchema,
  providerSpecific: z.record(z.any()).optional(),
  isDefault: z.boolean().optional(),
  isEnabled: z.boolean(),
});

// 供应商配置验证模式
export const providerConfigSchema = baseEntitySchema.extend({
  name: z.string(),
  models: z.array(z.string()),
  defaultBaseUrl: z.string().url().optional(),
  requiresOrganization: z.boolean().optional(),
  isEnabled: z.boolean(),
});

// 导出类型
export type ModelParameters = z.infer<typeof modelParametersSchema>;
export type AuthConfig = z.infer<typeof authConfigSchema>;
export type ModelConfig = z.infer<typeof modelConfigSchema>;
export type ProviderConfig = z.infer<typeof providerConfigSchema>; 