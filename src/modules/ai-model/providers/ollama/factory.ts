/**
 * Ollama供应商工厂方法
 */

import { OllamaProvider } from './provider';
import { ModelProvider } from '../../types/providers';

export function createOllamaProvider(): ModelProvider {
  return new OllamaProvider();
}

// 导出默认配置
export const defaultOllamaConfig = {
  baseURL: 'http://localhost:11434',
  defaultModel: 'llama2',
  timeout: 30000,
  maxRetries: 3,
  maxContextTokens: 32768,
  maxResponseTokens: 4096,
  temperature: 0.7,
  topP: 0.95,
  options: {
    num_ctx: 32768,
    num_predict: 4096,
  },
}; 