// 基础配置类型
export interface AIServiceConfig {
  baseURL: string;
  apiKey: string;
  timeout: number;
  maxRetries: number;
  retryDelay?: {
    base: number;
    max: number;
    factor: number;
  };
}

// 错误类型
export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly context?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AIServiceError';
    
    // 保留原始错误栈
    if (originalError?.stack) {
      this.stack = originalError.stack;
    }
  }
}

export class AITimeoutError extends AIServiceError {
  constructor(message: string, context?: string) {
    super(message, context);
    this.name = 'AITimeoutError';
  }
}

export class AIResponseError extends AIServiceError {
  constructor(
    message: string,
    public readonly response: any,
    context?: string
  ) {
    super(message, context);
    this.name = 'AIResponseError';
  }
}

// 提示词模板类型
export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  description?: string;
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object';
    description?: string;
    required: boolean;
    default?: any;
  }>;
  examples?: Array<{
    parameters: Record<string, any>;
    output: string;
  }>;
}

// 提示词渲染选项
export interface PromptRenderOptions {
  template: string | PromptTemplate;
  parameters: Record<string, any>;
  formatOptions?: {
    trim?: boolean;
    removeEmptyLines?: boolean;
    maxLength?: number;
  };
} 