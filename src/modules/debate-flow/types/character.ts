export interface CharacterConfig {
  id: string;
  name: string;
  role: 'judge' | 'debater' | 'moderator';
  description?: string;
  systemPrompt?: string;
  callConfig?: {
    direct?: {
      modelId: string;
      temperature?: number;
      topP?: number;
      maxTokens?: number;
    };
  };
  active?: boolean;
  metadata?: Record<string, any>;
} 