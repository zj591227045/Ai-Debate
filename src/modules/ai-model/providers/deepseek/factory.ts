/**
 * Deepseek供应商工厂方法
 */

import { DeepseekProvider } from './provider';
import { ModelProvider } from '../../types/providers';

export function createDeepseekProvider(): ModelProvider {
  return new DeepseekProvider();
}

// 导出默认配置
export const defaultDeepseekConfig = {
  defaultModel: 'deepseek-67b-chat',
  baseURL: 'https://api.deepseek.com/v1',
  timeout: 30000,
  maxRetries: 3,
  maxTokens: 4096,
  temperature: 0.7,
  topP: 1,
}; 