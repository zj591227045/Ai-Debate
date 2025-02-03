/**
 * 生成唯一ID
 * 使用时间戳和随机数的组合确保唯一性
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
} 