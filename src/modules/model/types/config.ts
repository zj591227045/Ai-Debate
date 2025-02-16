/**
 * 模型参数接口
 */
export interface ModelParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
}

/**
 * 认证配置接口
 */
export interface AuthConfig {
  baseUrl: string;           // 服务器地址（必选）
  apiKey?: string;          // API密钥（可选）
  organizationId?: string;  // 组织ID（可选）
}

/**
 * 模型配置接口
 */
export interface ModelConfig {
  id: string;               // 模型配置ID
  name: string;             // 模型配置名称
  provider: string;         // 供应商标识
  model: string;            // 模型标识
  parameters: ModelParameters; // 模型参数
  auth: AuthConfig;         // 认证信息
  isEnabled: boolean;       // 是否启用
  createdAt: number;        // 创建时间
  updatedAt: number;        // 更新时间
}

/**
 * 供应商配置接口
 */
export interface ProviderConfig {
  name: string;                 // 供应商名称
  code: string;                // 供应商代码
  description: string;          // 供应商描述
  website?: string;            // 供应商官网
  requiresApiKey: boolean;     // 是否需要API Key
  requiresBaseUrl: boolean;    // 是否需要基础URL
  defaultBaseUrl?: string;     // 默认基础URL
  models: ModelInfo[];         // 支持的模型列表
  parameterRanges: {          // 参数范围限制
    temperature?: { min: number; max: number; default: number };
    maxTokens?: { min: number; max: number; default: number };
    topP?: { min: number; max: number; default: number };
  };
}

/**
 * 模型信息接口
 */
export interface ModelInfo {
  name: string;               // 模型名称
  code: string;              // 模型代码
  description: string;       // 模型描述
  contextWindow: number;     // 上下文窗口大小
  maxTokens: number;        // 最大token数
  features: string[];       // 支持的特性
} 