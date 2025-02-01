/**
 * 文心一言供应商工厂方法
 */

import { BaiduProvider } from './provider';
import { ModelProvider } from '../../types/providers';

export function createBaiduProvider(): ModelProvider {
  return new BaiduProvider();
}

// 导出默认配置
export const defaultBaiduConfig = {
  defaultModel: 'ernie-bot-4',
  baseURL: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat',
  timeout: 30000,
  maxRetries: 3,
  maxTokens: 4096,
  temperature: 0.7,
  topP: 0.95,
}; 