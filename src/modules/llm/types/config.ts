export interface ModelParameters {
  temperature: number;
  topP: number;
  maxTokens: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string[];
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

export interface ModelCapabilities {
  streaming: boolean;
  functionCalling: boolean;
}

export interface PricingInfo {
  inputPrice: number;
  outputPrice: number;
  unit: string;
  currency: string;
}

export interface ModelMetadata {
  description: string;
  contextWindow: number;
  tokenizerName: string;
  pricingInfo: PricingInfo;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  auth: {
    baseUrl: string;
    apiKey: string;
  };
  parameters: ModelParameters;
  capabilities: ModelCapabilities;
  metadata: ModelMetadata;
  providerSpecific?: Record<string, any>;
  isEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export default ModelConfig;
