/**
 * AI模型Token计数工具类
 */

import { Message } from '../types/common';
import { TokenCounter } from '../types/providers';

export class ModelTokenCounter implements TokenCounter {
  private readonly modelTokenLimit: number;
  private readonly averageCharsPerToken: number;

  constructor(
    modelTokenLimit: number = 4096,
    averageCharsPerToken: number = 4
  ) {
    this.modelTokenLimit = modelTokenLimit;
    this.averageCharsPerToken = averageCharsPerToken;
  }

  countMessageTokens(messages: Message[]): number {
    let totalTokens = 0;
    
    for (const message of messages) {
      // 计算消息内容的token
      totalTokens += this.countTextTokens(message.content);
      
      // 计算角色标识的token（通常2-4个token）
      totalTokens += 3;
      
      // 如果有name字段，添加额外的token
      if (message.name) {
        totalTokens += this.countTextTokens(message.name);
      }
      
      // 如果有function call，计算相关token
      if (message.functionCall) {
        totalTokens += this.countTextTokens(message.functionCall.name);
        totalTokens += this.countTextTokens(message.functionCall.arguments);
        totalTokens += 3; // 函数调用的格式开销
      }
    }
    
    return totalTokens;
  }

  countTextTokens(text: string): number {
    if (!text) {
      return 0;
    }
    
    // 使用简单的字符估算方法
    // 注意：这只是一个粗略的估算，不同模型可能有不同的token计算方式
    const tokenEstimate = Math.ceil(text.length / this.averageCharsPerToken);
    
    // 考虑标点符号和特殊字符
    const punctuationCount = (text.match(/[.,!?;:'"()\[\]{}]/g) || []).length;
    const whitespaceCount = (text.match(/\s+/g) || []).length;
    
    // 标点符号通常是单独的token
    return tokenEstimate + punctuationCount + whitespaceCount;
  }

  getModelTokenLimit(): number {
    return this.modelTokenLimit;
  }

  // 检查是否超过Token限制
  isExceedingLimit(tokens: number): boolean {
    return tokens > this.modelTokenLimit;
  }

  // 计算剩余可用Token
  getRemainingTokens(usedTokens: number): number {
    return Math.max(0, this.modelTokenLimit - usedTokens);
  }

  // 估算完整对话的Token使用量
  estimateConversationTokens(
    systemPrompt: string,
    conversation: Message[],
    expectedResponse: number = 800
  ): number {
    const systemTokens = this.countTextTokens(systemPrompt);
    const conversationTokens = this.countMessageTokens(conversation);
    
    return systemTokens + conversationTokens + expectedResponse;
  }

  // 截断文本以适应Token限制
  truncateToFit(text: string, maxTokens: number): string {
    if (this.countTextTokens(text) <= maxTokens) {
      return text;
    }
    
    // 简单的截断策略，可以根据需要改进
    const estimatedChars = maxTokens * this.averageCharsPerToken;
    return text.slice(0, estimatedChars) + '...';
  }
} 