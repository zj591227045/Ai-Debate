import type { ModelCapabilities } from './common';

export interface ModelParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stop?: string[];
}

export interface AuthConfig {
  baseUrl: string;
  endpoint?: string;
  apiKey?: string;
  organizationId?: string;
  providerSpecific?: Record<string, unknown>;
}

// 为了向后兼容，保留 ApiConfig 类型别名
export type ApiConfig = AuthConfig;

export interface AIModelConfig {
  provider: string;
  model: string;
  parameters: ModelParameters;
  capabilities?: ModelCapabilities;
  auth: AuthConfig;
}

export default AIModelConfig;