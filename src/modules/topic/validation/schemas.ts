import { z } from 'zod';
import { baseEntitySchema } from '../../storage/validation/schemas/base.schema';
import { TopicType, DebateType } from '../types';

// 主题类型验证
const topicTypeSchema = z.enum(['policy', 'value', 'fact'] as const);

// 辩论类型验证
const debateTypeSchema = z.enum(['binary', 'multi'] as const);

// 主题验证模式
export const topicSchema = baseEntitySchema.extend({
  title: z.string()
    .min(2, '辩题至少需要2个字符')
    .max(100, '辩题最多100个字符'),
  description: z.string()
    .min(10, '描述至少需要10个字符')
    .max(500, '描述最多500个字符'),
  background: z.string().optional(),
  type: topicTypeSchema,
  debateType: debateTypeSchema,
  isTemplate: z.boolean(),
  templateId: z.string().optional(),
  usageCount: z.number().int().min(0),
  lastUsed: z.number().optional(),
  tags: z.array(z.string()),
  version: z.number().int().min(1),
  isLatest: z.boolean(),
  previousVersions: z.array(z.string()).optional(),
});

// 创建主题验证模式
export const createTopicSchema = topicSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  lastUsed: true,
  version: true,
  isLatest: true,
  previousVersions: true,
});

// 更新主题验证模式
export const updateTopicSchema = createTopicSchema.partial(); 