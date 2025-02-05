interface AIConfig {
  baseURL: string;
  apiKey: string;
  timeout: number;
  maxRetries: number;
  retryDelay: {
    base: number;
    max: number;
    factor: number;
  };
}

// 默认配置
export const defaultAIConfig: AIConfig = {
  baseURL: process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:3000/api/ai',
  apiKey: process.env.REACT_APP_AI_SERVICE_KEY || '',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: {
    base: 1000,
    max: 5000,
    factor: 1.5
  }
};

// 创建配置
export const createAIConfig = (overrides?: Partial<AIConfig>): AIConfig => ({
  ...defaultAIConfig,
  ...overrides
}); 