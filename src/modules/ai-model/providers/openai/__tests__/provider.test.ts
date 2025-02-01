/**
 * OpenAI供应商测试
 */

import { OpenAIProvider } from '../provider';
import { Message, ModelError } from '../../../types/common';
import { ApiConfig } from '../../../types/config';

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let mockConfig: ApiConfig;

  beforeEach(() => {
    provider = new OpenAIProvider();
    mockConfig = {
      apiKey: 'test-api-key',
      endpoint: 'https://api.openai.com/v1',
      timeout: 30000,
      maxRetries: 3,
    };
  });

  describe('initialize', () => {
    it('should initialize with correct config', async () => {
      await provider.initialize(mockConfig);
      expect(provider['config'].apiKey).toBe(mockConfig.apiKey);
      expect(provider['config'].baseURL).toBe(mockConfig.endpoint);
    });
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const capabilities = provider.getCapabilities();
      expect(capabilities.streaming).toBe(true);
      expect(capabilities.functionCalling).toBe(true);
      expect(capabilities.maxContextTokens).toBe(4096);
    });
  });

  describe('generateCompletion', () => {
    const mockMessages: Message[] = [
      { role: 'user', content: 'Hello' }
    ];

    it('should handle successful completion', async () => {
      // Mock fetch response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          choices: [{
            message: { content: 'Hello there!' },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30
          },
          created: 1234567890
        })
      });

      await provider.initialize(mockConfig);
      const response = await provider.generateCompletion(mockMessages);

      expect(response.content).toBe('Hello there!');
      expect(response.usage.totalTokens).toBe(30);
    });

    it('should handle rate limit errors', async () => {
      // Mock rate limit error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: {
            message: 'Rate limit exceeded',
            type: 'rate_limit_exceeded',
            code: 'rate_limit'
          }
        })
      });

      await provider.initialize(mockConfig);
      
      try {
        await provider.generateCompletion(mockMessages);
        fail('Should have thrown an error');
      } catch (error) {
        const modelError = error as ModelError;
        expect(modelError.type).toBe('rate_limit');
        expect(modelError.retryable).toBe(true);
      }
    });
  });

  describe('validateApiKey', () => {
    it('should return true for valid API key', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      await provider.initialize(mockConfig);
      const isValid = await provider.validateApiKey();
      expect(isValid).toBe(true);
    });

    it('should return false for invalid API key', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: {
            message: 'Invalid API key',
            type: 'invalid_api_key'
          }
        })
      });

      await provider.initialize(mockConfig);
      const isValid = await provider.validateApiKey();
      expect(isValid).toBe(false);
    });
  });

  describe('countTokens', () => {
    it('should estimate token count correctly', () => {
      const text = 'Hello, this is a test message!';
      const tokenCount = provider.countTokens(text);
      expect(tokenCount).toBeGreaterThan(0);
    });
  });
}); 