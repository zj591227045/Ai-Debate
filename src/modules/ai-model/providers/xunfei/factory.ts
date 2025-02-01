/**
 * 讯飞星火供应商工厂方法
 */

import { XunfeiProvider } from './provider';
import { ModelProvider } from '../../types/providers';

export function createXunfeiProvider(): ModelProvider {
  return new XunfeiProvider();
}

// 导出默认配置
export const defaultXunfeiConfig = {
  defaultModel: 'spark-v2',
  baseURL: 'https://api.xf-yun.com/v1',
  timeout: 30000,
  maxRetries: 3,
  maxTokens: 4096,
  temperature: 0.7,
  topP: 0.95,
}; 