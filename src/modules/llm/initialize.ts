import { LLMService } from './services/LLMService';

export function initializeLLMModule() {
  // 初始化 LLM 服务
  const llmService = LLMService.getInstance();
  console.log('LLM 模块初始化完成');
  return llmService;
} 