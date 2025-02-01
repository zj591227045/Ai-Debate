/**
 * AI模型速率限制工具类
 */

import { RateLimiter } from '../types/providers';

export class ModelRateLimiter implements RateLimiter {
  private requestCount: number = 0;
  private tokenCount: number = 0;
  private readonly maxRequestsPerMinute: number;
  private readonly maxTokensPerMinute: number;
  private lastResetTime: number;

  constructor(
    maxRequestsPerMinute: number = 60,
    maxTokensPerMinute: number = 90000
  ) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
    this.maxTokensPerMinute = maxTokensPerMinute;
    this.lastResetTime = Date.now();
  }

  canMakeRequest(): boolean {
    this.checkAndResetQuota();
    
    // 检查是否超过请求限制
    if (this.requestCount >= this.maxRequestsPerMinute) {
      return false;
    }
    
    // 检查是否超过Token限制
    if (this.tokenCount >= this.maxTokensPerMinute) {
      return false;
    }
    
    return true;
  }

  recordRequest(tokens: number): void {
    this.checkAndResetQuota();
    
    // 记录请求和Token使用量
    this.requestCount++;
    this.tokenCount += tokens;
  }

  getRemainingQuota(): { requests: number; tokens: number; } {
    this.checkAndResetQuota();
    
    return {
      requests: Math.max(0, this.maxRequestsPerMinute - this.requestCount),
      tokens: Math.max(0, this.maxTokensPerMinute - this.tokenCount)
    };
  }

  resetQuota(): void {
    this.requestCount = 0;
    this.tokenCount = 0;
    this.lastResetTime = Date.now();
  }

  private checkAndResetQuota(): void {
    const now = Date.now();
    const timeSinceLastReset = now - this.lastResetTime;
    
    // 如果已经过去了一分钟，重置配额
    if (timeSinceLastReset >= 60000) {
      this.resetQuota();
    }
  }

  // 获取下一个可用时间点
  getNextAvailableTime(): number {
    if (this.canMakeRequest()) {
      return Date.now();
    }
    
    // 返回下一个重置时间点
    return this.lastResetTime + 60000;
  }

  // 获取当前使用情况
  getUsage(): { requestPercent: number; tokenPercent: number; } {
    return {
      requestPercent: (this.requestCount / this.maxRequestsPerMinute) * 100,
      tokenPercent: (this.tokenCount / this.maxTokensPerMinute) * 100
    };
  }

  // 检查是否接近限制
  isApproachingLimit(thresholdPercent: number = 80): boolean {
    const usage = this.getUsage();
    return usage.requestPercent >= thresholdPercent || 
           usage.tokenPercent >= thresholdPercent;
  }
} 