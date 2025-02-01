/**
 * 通义千问供应商工厂方法
 */

import { AliyunProvider } from './provider';
import { ModelProvider } from '../../types/providers';

export function createAliyunProvider(): ModelProvider {
  return new AliyunProvider();
}

// 导出默认配置
export const defaultAliyunConfig = {
  defaultModel: 'qwen-turbo',
  baseURL: 'https://dashscope.aliyuncs.com/api/v1',
  timeout: 30000,
  maxRetries: 3,
  maxTokens: 4096,
  temperature: 0.7,
  topP: 0.95,
}; 