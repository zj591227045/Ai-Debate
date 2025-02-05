/**
 * AI模型管理模块的配置类型定义
 */

import { ModelProvider, ModelCapabilities, CostUnit } from './common';
import { SafetyCategory, SafetyThreshold } from '../providers/gemini/types';

// API配置接口
export interface ApiConfig {
  endpoint: string;
  apiKey: string;
  apiVersion?: string;
  organizationId?: string;
  timeout?: number;
  maxRetries?: number;
  secretKey?: string;
  providerSpecific?: {
    openai?: {
      organizationId: string;
    };
    ollama?: {
      model?: string;
      options?: {
        temperature?: number;
        top_p?: number;
        top_k?: number;
        repeat_penalty?: number;
        seed?: number;
        num_predict?: number;
        stop?: string[];
        num_ctx?: number;
      };
      useLocalEndpoint?: boolean;
    };
    aliyun?: {
      accessKeyId: string;
      accessKeySecret: string;
      region: string;
    };
    baidu?: {
      accessKey: string;
      secretKey: string;
    };
    deepseek?: {
      organizationId: string;
      model?: string;
    };
    gemini?: {
      safetySettings?: Array<{
        category: SafetyCategory;
        threshold: SafetyThreshold;
      }>;
    };
    huggingface?: {
      waitForModel?: boolean;
      useCache?: boolean;
      modelRevision?: string;
    };
    localai?: {
      model: string;
      options?: {
        temperature?: number;
        top_p?: number;
        top_k?: number;
        repeat_penalty?: number;
        presence_penalty?: number;
        frequency_penalty?: number;
        seed?: number;
        max_tokens?: number;
        stop?: string[];
      };
    };
    volcengine?: {
      region: string;
      projectId: string;
    };
    xunfei?: {
      appId: string;
      apiSecret: string;
    };
  };
}

// 模型配置接口
export interface ModelConfig {
  provider: ModelProvider;
  modelName: string;
  capabilities: ModelCapabilities;
  costPerUnit: CostUnit;
  apiConfig: ApiConfig;
  defaultParameters?: {
    temperature: number;
    topP: number;
    maxTokens: number;
    presencePenalty: number;
    frequencyPenalty: number;
  };
}

// 安全配置
export interface SecurityConfig {
  encryptionKey?: string;
  keyRotationInterval?: number;
  maxKeyAge?: number;
  allowedIPs?: string[];
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
    costPerDay: number;
  };
}

// 缓存配置
export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'fifo';
}

// 监控配置
export interface MonitoringConfig {
  enabled: boolean;
  metricsInterval: number;
  alertThresholds: {
    errorRate: number;
    latency: number;
    costPerHour: number;
  };
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// 供应商特定配置
export interface ProviderSpecificConfig {
  // OpenAI特定配置
  openai?: {
    organizationId: string;
    beta?: boolean;
  };
  
  // Anthropic特定配置
  anthropic?: {
    version: string;
  };
  
  // 火山引擎特定配置
  volcengine?: {
    region: string;
    projectId: string;
  };
  
  // 讯飞星火特定配置
  xunfei?: {
    appId: string;
    apiSecret: string;
  };
  
  // 阿里云特定配置
  aliyun?: {
    accessKeyId: string;
    accessKeySecret: string;
    region: string;
  };
  
  // 百度特定配置
  baidu?: {
    accessKey: string;
    secretKey: string;
  };
  
  // Deepseek特定配置
  deepseek?: {
    organizationId: string;
  };

  // Gemini特定配置
  gemini?: {
    safetySettings?: {
      category: SafetyCategory;
      threshold: SafetyThreshold;
    }[];
  };
  
  // 本地模型特定配置
  local?: {
    modelPath: string;
    deviceType: 'cpu' | 'gpu';
    maxMemory?: number;
  };

  // Hugging Face特定配置
  huggingface?: {
    waitForModel?: boolean;
    useCache?: boolean;
    modelRevision?: string;
  };

  // Ollama特定配置
  ollama?: {
    model: string;
    options?: {
      temperature?: number;
      top_p?: number;
      top_k?: number;
      repeat_penalty?: number;
      seed?: number;
      num_predict?: number;
      stop?: string[];
      num_ctx?: number;
    };
  };

  // LocalAI特定配置
  localai?: {
    model: string;
    options?: {
      temperature?: number;
      top_p?: number;
      top_k?: number;
      repeat_penalty?: number;
      presence_penalty?: number;
      frequency_penalty?: number;
      seed?: number;
      max_tokens?: number;
      stop?: string[];
    };
  };
}

// 完整配置接口
export interface AIModelConfig {
  models: ModelConfig[];
  security: SecurityConfig;
  cache: CacheConfig;
  monitoring: MonitoringConfig;
  providerSpecific: ProviderSpecificConfig;
} 