import { z } from 'zod';

// 基础实体验证模式
export const baseEntitySchema = z.object({
  id: z.string().min(1),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

// 导出类型
export type BaseEntity = z.infer<typeof baseEntitySchema>; 