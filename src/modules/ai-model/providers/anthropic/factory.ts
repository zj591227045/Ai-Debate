/**
 * Anthropic供应商工厂方法
 */

import { AnthropicProvider } from './provider';
import { ModelProvider } from '../../types/providers';

export function createAnthropicProvider(): ModelProvider {
  return new AnthropicProvider();
}

// 导出默认配置
export const defaultAnthropicConfig = {
  defaultModel: 'claude-3-opus',
  baseURL: 'https://api.anthropic.com/v1',
  timeout: 30000,
  maxRetries: 3,
  maxTokens: 4096,
  temperature: 0.7,
  topP: 1,
  version: '2024-03-10'
}; 