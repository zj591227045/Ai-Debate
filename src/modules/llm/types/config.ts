export interface ModelParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
}

export interface AuthConfig {
  apiKey?: string;
  organizationId?: string;
  baseUrl?: string;
}

export interface ProviderSpecific {
  [key: string]: any;
}

export interface ApiConfig {
  endpoint: string;
  apiKey: string;
  organizationId?: string;
  providerSpecific?: {
    openai?: {
      organizationId?: string;
    };
    ollama?: {
      model: string;
      options?: {
        temperature?: number;
        top_p?: number;
        num_predict?: number;
      };
      useLocalEndpoint?: boolean;
    };
  };
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  parameters: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  auth: {
    baseUrl: string;
    apiKey?: string;
    organizationId?: string;
  };
  providerSpecific?: Record<string, any>;
  isEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export default ModelConfig;
