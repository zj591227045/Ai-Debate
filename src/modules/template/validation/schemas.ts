import { z } from 'zod';
import { baseEntitySchema } from '../../storage/validation/schemas/base.schema';
import { topicSchema } from '../../topic/validation/schemas';
import { rulesSchema } from '../../rules/validation/schemas';

// 模板内容验证模式
const templateContentSchema = z.object({
  topic: topicSchema,
  rules: rulesSchema,
});

// 模板表单内容验证模式
const templateFormContentSchema = z.object({
  topic: topicSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    usageCount: true,
    lastUsed: true,
  }),
  rules: rulesSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  }),
});

// 模板验证模式
export const templateSchema = baseEntitySchema.extend({
  name: z.string().min(2, '模板名称至少需要2个字符').max(50, '模板名称最多50个字符'),
  description: z.string().min(10, '模板描述至少需要10个字符').max(500, '模板描述最多500个字符').optional(),
  content: templateContentSchema,
  category: z.string().min(1, '分类不能为空'),
  tags: z.array(z.string()).min(1, '至少需要一个标签'),
  isPreset: z.boolean(),
  isEditable: z.boolean(),
  usageCount: z.number().int().min(0),
  lastUsed: z.number().optional(),
});

// 创建模板验证模式
export const createTemplateSchema = templateSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    usageCount: true,
    lastUsed: true,
  })
  .extend({
    content: templateFormContentSchema,
  });

// 更新模板验证模式
export const updateTemplateSchema = createTemplateSchema.partial();

// 模板分类验证模式
export const templateCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(2, '分类名称至少需要2个字符').max(20, '分类名称最多20个字符'),
  description: z.string().max(100, '分类描述最多100个字符').optional(),
  order: z.number().int().min(0),
  count: z.number().int().min(0),
});

// 模板标签验证模式
export const templateTagSchema = z.object({
  id: z.string(),
  name: z.string().min(2, '标签名称至少需要2个字符').max(20, '标签名称最多20个字符'),
  count: z.number().int().min(0),
}); 