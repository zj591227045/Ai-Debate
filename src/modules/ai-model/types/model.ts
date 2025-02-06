export type ModelParameters = {
  temperature: number;
  topP: number;
  maxTokens: number;
}

export type ApiConfig = {
  endpoint?: string;
  apiKey: string;
  organizationId?: string;
  providerSpecific?: {
    [key: string]: any;
  };
}

export type AIModelConfig = {
  provider: string;
  model: string;
  parameters: ModelParameters;
  auth?: ApiConfig;
}

export type ProviderOptions = {
  model: string;
  baseUrl?: string;
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
}

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
} 