/**
 * Hugging Face供应商工厂方法
 */

import { HuggingFaceProvider } from './provider';
import { ModelProvider } from '../../types/providers';

export function createHuggingFaceProvider(): ModelProvider {
  return new HuggingFaceProvider();
}

// 导出默认配置
export const defaultHuggingFaceConfig = {
  defaultModel: 'gpt2',
  baseURL: 'https://api-inference.huggingface.co/models',
  timeout: 30000,
  maxRetries: 3,
  maxContextTokens: 8192,
  maxResponseTokens: 2048,
  temperature: 0.7,
  topP: 0.95,
  waitForModel: true,
  useCache: true,
}; 