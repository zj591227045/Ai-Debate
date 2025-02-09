/**
 * LLM模型能力定义
 */

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