import type { ChatRequest, ChatResponse, TestResult } from '../../api/types';
import { LLMError, LLMErrorCode } from '../../types/error';

export abstract class LLMProvider {
  abstract get name(): string;
  
  abstract initialize(skipModelValidation?: boolean): Promise<void>;
  
  abstract chat(request: ChatRequest): Promise<ChatResponse>;
  
  abstract stream(request: ChatRequest): AsyncGenerator<ChatResponse>;
  
  abstract test(): Promise<TestResult>;

  abstract listModels(): Promise<string[]>;

  abstract validateConfig(): Promise<void>;

  getProviderName(): string {
    return this.name;
  }
  
  handleError(error: unknown): LLMError {
    if (error instanceof LLMError) {
      return error;
    }
    return new LLMError(
      LLMErrorCode.UNKNOWN,
      this.name,
      error instanceof Error ? error : undefined
    );
  }
}

export default LLMProvider;
