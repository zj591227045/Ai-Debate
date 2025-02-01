/**
 * 火山引擎供应商工厂方法
 */

import { VolcengineProvider } from './provider';
import { ModelProvider } from '../../types/providers';

export function createVolcengineProvider(): ModelProvider {
  return new VolcengineProvider();
}

// 导出默认配置
export const defaultVolcengineConfig = {
  defaultModel: 'skylark2-pro-32k',
  baseURL: 'https://maas-api.ml-platform-cn-beijing.volces.com',
  timeout: 30000,
  maxRetries: 3,
  maxTokens: 4096,
  temperature: 0.7,
  topP: 1,
  region: 'cn-beijing'
}; 