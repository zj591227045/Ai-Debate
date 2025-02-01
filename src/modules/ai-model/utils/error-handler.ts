/**
 * AI模型错误处理工具类
 */

import { ModelError } from '../types/common';
import { ErrorHandler } from '../types/providers';

export class ModelErrorHandler implements ErrorHandler {
  private readonly maxRetries: number;
  private readonly baseDelay: number;
  private readonly maxDelay: number;

  constructor(
    maxRetries: number = 3,
    baseDelay: number = 1000,
    maxDelay: number = 10000
  ) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  async handleError(error: ModelError): Promise<void> {
    // 记录错误
    console.error(`AI Model Error: [${error.code}] ${error.message}`);
    
    // 根据错误类型执行不同的处理策略
    switch (error.type) {
      case 'auth':
        // 认证错误通常不需要重试
        throw new Error('Authentication failed. Please check your API credentials.');
      
      case 'rate_limit':
        // 速率限制错误需要等待
        await this.handleRateLimitError(error);
        break;
      
      case 'server':
        // 服务器错误可能需要重试
        if (error.retryable) {
          console.warn('Server error encountered, will retry with backoff');
        }
        break;
      
      case 'timeout':
        // 超时错误可能需要重试
        if (error.retryable) {
          console.warn('Request timeout, will retry with backoff');
        }
        break;
      
      default:
        // 其他错误类型
        console.error('Unexpected error type:', error.type);
        break;
    }
  }

  shouldRetry(error: ModelError): boolean {
    // 判断错误是否可重试
    if (!error.retryable) {
      return false;
    }

    // 根据错误类型判断是否应该重试
    switch (error.type) {
      case 'auth':
        return false; // 认证错误不重试
      case 'rate_limit':
        return true;  // 速率限制错误总是重试
      case 'server':
      case 'timeout':
        return true;  // 服务器错误和超时错误可以重试
      case 'invalid_request':
        return false; // 无效请求不重试
      default:
        return false; // 未知错误类型默认不重试
    }
  }

  getRetryDelay(attempt: number): number {
    // 使用指数退避策略计算延迟时间
    const delay = Math.min(
      this.maxDelay,
      this.baseDelay * Math.pow(2, attempt - 1)
    );
    
    // 添加随机抖动，避免多个请求同时重试
    return delay + Math.random() * 1000;
  }

  private async handleRateLimitError(error: ModelError): Promise<void> {
    // 获取需要等待的时间（从错误信息中解析或使用默认值）
    const waitTime = this.parseRateLimitWaitTime(error) || this.baseDelay;
    console.warn(`Rate limit exceeded. Waiting for ${waitTime}ms before retry.`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  private parseRateLimitWaitTime(error: ModelError): number | null {
    // 尝试从错误消息中解析等待时间
    // 不同供应商可能有不同的格式
    try {
      const match = error.message.match(/retry after (\d+)/i);
      if (match) {
        return parseInt(match[1]) * 1000; // 转换为毫秒
      }
      return null;
    } catch {
      return null;
    }
  }
} 