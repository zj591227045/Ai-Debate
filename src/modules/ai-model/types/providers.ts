/**
 * AI模型供应商接口定义
 */

import { Message, ModelParameters, ModelResponse, ModelError, ModelCapabilities } from './common';
import { ApiConfig } from './config';

// 基础供应商接口
export interface ModelProvider {
  // 初始化方法
  initialize(config: ApiConfig): Promise<void>;
  
  // 获取模型能力
  getCapabilities(): ModelCapabilities;
  
  // 生成回复
  generateCompletion(
    messages: Message[],
    parameters?: ModelParameters
  ): Promise<ModelResponse>;
  
  // 流式生成回复
  generateCompletionStream(
    messages: Message[],
    parameters?: ModelParameters
  ): AsyncGenerator<ModelResponse>;
  
  // 计算Token数量
  countTokens(text: string): number;
  
  // 验证API密钥
  validateApiKey(): Promise<boolean>;
}

// 供应商工厂接口
export interface ModelProviderFactory {
  // 创建供应商实例
  createProvider(
    provider: string,
    config: ApiConfig
  ): Promise<ModelProvider>;
  
  // 获取支持的供应商列表
  getSupportedProviders(): string[];
  
  // 验证供应商配置
  validateProviderConfig(
    provider: string,
    config: ApiConfig
  ): Promise<boolean>;
}

// 供应商管理器接口
export interface ProviderManager {
  // 注册新供应商
  registerProvider(
    provider: string,
    factory: () => ModelProvider
  ): void;
  
  // 获取供应商实例
  getProvider(provider: string): ModelProvider;
  
  // 移除供应商
  removeProvider(provider: string): void;
  
  // 获取所有已注册的供应商
  getRegisteredProviders(): string[];
}

// 错误处理接口
export interface ErrorHandler {
  // 处理错误
  handleError(error: ModelError): Promise<void>;
  
  // 判断是否需要重试
  shouldRetry(error: ModelError): boolean;
  
  // 获取重试延迟时间
  getRetryDelay(attempt: number): number;
}

// 速率限制接口
export interface RateLimiter {
  // 检查是否可以发送请求
  canMakeRequest(): boolean;
  
  // 记录请求
  recordRequest(tokens: number): void;
  
  // 获取剩余配额
  getRemainingQuota(): {
    requests: number;
    tokens: number;
  };
  
  // 重置配额
  resetQuota(): void;
}

// Token计数器接口
export interface TokenCounter {
  // 计算消息Token数量
  countMessageTokens(messages: Message[]): number;
  
  // 计算文本Token数量
  countTextTokens(text: string): number;
  
  // 获取模型最大Token限制
  getModelTokenLimit(): number;
} 