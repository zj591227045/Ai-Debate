export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  maxContextTokens: number;
  maxResponseTokens: number;
  multipleCompletions: boolean;
}

export interface ProviderCapabilities extends ModelCapabilities {
  supportedModels: string[];
  supportedParameters: {
    temperature?: boolean;
    topP?: boolean;
    maxTokens?: boolean;
    presencePenalty?: boolean;
    frequencyPenalty?: boolean;
    stop?: boolean;
  };
} 