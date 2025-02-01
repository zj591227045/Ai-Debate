/**
 * LocalAI供应商工厂方法
 */

import { LocalAIProvider } from './provider';
import { ModelProvider } from '../../types/providers';

export function createLocalAIProvider(): ModelProvider {
  return new LocalAIProvider();
}

// 导出默认配置
export const defaultLocalAIConfig = {
  baseURL: 'http://localhost:8080/v1',
  defaultModel: 'gpt-3.5-turbo',
  timeout: 30000,
  maxRetries: 3,
  maxContextTokens: 8192,
  maxResponseTokens: 2048,
  temperature: 0.7,
  topP: 0.95,
  options: {
    max_tokens: 2048,
  },
}; 