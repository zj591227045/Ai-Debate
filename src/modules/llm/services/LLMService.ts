import type { ChatRequest, ChatResponse } from '../api/types';
import type { ModelConfig } from '../../model/types';
import { UnifiedLLMService } from './UnifiedLLMService';
import { LLMError, LLMErrorCode } from '../types/error';

export class LLMService {
  private static instance: LLMService;
  private unifiedService: UnifiedLLMService;

  private constructor() {
    this.unifiedService = UnifiedLLMService.getInstance();
  }

  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      return await this.unifiedService.chat(request);
    } catch (error) {
      console.error('Chat error:', error);
      throw this.handleError(error);
    }
  }

  async *stream(request: ChatRequest): AsyncGenerator<ChatResponse> {
    try {
      yield* this.unifiedService.stream(request);
    } catch (error) {
      console.error('Stream error:', error);
      throw this.handleError(error);
    }
  }

  // 便捷方法：使用模型配置进行测试
  async testModel(config: ModelConfig): Promise<void> {
    try {
      console.log('Testing model with config:', config);
      
      // 设置当前模型配置
      await this.unifiedService.setModelConfig(config);
      
      // 发送测试消息
      await this.chat({
        message: 'Hi',
        systemPrompt: '你是一个有帮助的AI助手。',
        temperature: config.parameters?.temperature ?? 0.7,
        maxTokens: config.parameters?.maxTokens ?? 2000,
        topP: config.parameters?.topP ?? 1,
        model: config.model
      });
    } catch (error) {
      console.error('Model test error:', error);
      throw error;
    }
  }

  private handleError(error: unknown): LLMError {
    if (error instanceof LLMError) {
      return error;
    }
    return new LLMError(
      LLMErrorCode.UNKNOWN,
      'llm_service',
      error instanceof Error ? error : undefined
    );
  }
}