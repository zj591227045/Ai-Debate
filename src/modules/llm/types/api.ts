export interface GenerateStreamOptions {
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  characterId?: string;
  type?: 'innerThoughts' | 'speech';
  signal?: AbortSignal;
  humanPrompt?: string;
}

export interface GenerateStreamResponse {
  content: ReadableStream<Uint8Array>;
  metadata?: {
    characterId: string;
    type: 'innerThoughts' | 'speech';
    startTime: number;
  };
  status: 'streaming' | 'completed' | 'error';
  error?: Error;
}

export interface ChatOptions {
  characterId: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  signal?: AbortSignal;
}

export interface ChatResponse {
  content: string;
  metadata: {
    characterId: string;
    startTime: number;
    endTime: number;
  };
}

export interface ServiceStatus {
  isAvailable: boolean;
  currentModel: string | null;
  error: string | null;
}

export interface LLMService {
  generateStream(options: GenerateStreamOptions): AsyncIterable<string>;
} 