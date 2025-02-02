import { z } from 'zod';

// 基础实体验证模式
export const baseEntitySchema = z.object({
  id: z.string().min(1, 'ID不能为空'),
  createdAt: z.number().int('创建时间必须是整数').min(0, '创建时间不能为负数'),
  updatedAt: z.number().int('更新时间必须是整数').min(0, '更新时间不能为负数'),
});

// 时间戳验证模式
export const timestampSchema = z.number().int('时间戳必须是整数').min(0, '时间戳不能为负数');

// 通用的元数据验证模式
export const metadataSchema = z.object({
  version: z.string().min(1, '版本号不能为空'),
  timestamp: timestampSchema,
});

// 通用的ID验证模式
export const idSchema = z.string().min(1, 'ID不能为空');

// 通用的名称验证模式
export const nameSchema = z.string().min(1, '名称不能为空').max(50, '名称最多50个字符');

// 通用的描述验证模式
export const descriptionSchema = z.string().max(500, '描述最多500个字符').optional();

// 通用的URL验证模式
export const urlSchema = z.string().url('必须是有效的URL').optional(); 