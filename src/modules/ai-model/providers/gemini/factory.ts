/**
 * Gemini供应商工厂方法
 */

import { GeminiProvider } from './provider';
import { ModelProvider } from '../../types/providers';
import { SafetyCategory, SafetyThreshold } from './types';

export function createGeminiProvider(): ModelProvider {
  return new GeminiProvider();
}

// 导出默认配置
export const defaultGeminiConfig = {
  defaultModel: 'gemini-pro',
  baseURL: 'https://generativelanguage.googleapis.com/v1',
  timeout: 30000,
  maxRetries: 3,
  maxTokens: 8192,
  temperature: 0.7,
  topP: 0.95,
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT' as SafetyCategory,
      threshold: 'BLOCK_MEDIUM_AND_ABOVE' as SafetyThreshold,
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH' as SafetyCategory,
      threshold: 'BLOCK_MEDIUM_AND_ABOVE' as SafetyThreshold,
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as SafetyCategory,
      threshold: 'BLOCK_MEDIUM_AND_ABOVE' as SafetyThreshold,
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as SafetyCategory,
      threshold: 'BLOCK_MEDIUM_AND_ABOVE' as SafetyThreshold,
    },
  ],
}; 
