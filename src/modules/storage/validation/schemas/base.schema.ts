import { z } from 'zod';

// 基础实体接口
export interface IBaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

// 基础实体验证模式
export const baseEntitySchema = z.object({
  id: z.string().min(1),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

// 导出基础类型
export type BaseEntity = z.infer<typeof baseEntitySchema>;

// 导出通用 schema
export const nameSchema = z.string().min(1, '名称不能为空');
export const descriptionSchema = z.string().min(1, '描述不能为空');
export const urlSchema = z.string().url('请输入有效的URL'); 