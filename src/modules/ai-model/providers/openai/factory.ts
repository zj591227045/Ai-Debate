/**
 * OpenAI供应商工厂方法
 */

import { OpenAIProvider } from './provider';
import { ModelProvider } from '../../types/providers';

export function createOpenAIProvider(): ModelProvider {
  return new OpenAIProvider();
}

// 导出默认配置
export const defaultOpenAIConfig = {
  defaultModel: 'gpt-3.5-turbo',
  baseURL: 'https://api.openai.com/v1',
  timeout: 30000,
  maxRetries: 3,
  maxTokens: 2048,
  temperature: 0.7,
  topP: 1,
}; 