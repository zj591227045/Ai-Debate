import { createLLMService } from '../llmService';
import { AITimeoutError } from '../types';

// Mock fetch
global.fetch = jest.fn();

describe('LLMService', () => {
  const mockConfig = {
    baseURL: 'http://test-api.com',
    apiKey: 'test-key',
    timeout: 1000,
    maxRetries: 3
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate text successfully', async () => {
    const mockResponse = {
      choices: [{ text: '测试响应' }],
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const service = createLLMService(mockConfig);
    const result = await service.generate({
      prompt: '测试提示词'
    });

    expect(result.text).toBe('测试响应');
    expect(result.usage).toEqual(mockResponse.usage);
    expect(global.fetch).toHaveBeenCalledWith(
      mockConfig.baseURL,
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockConfig.apiKey}`
        },
        body: expect.any(String)
      })
    );
  });

  it('should handle timeout correctly', async () => {
    jest.useFakeTimers();
    
    const generatePromise = createLLMService(mockConfig).generate({
      prompt: '测试提示词',
      timeout: 500
    });

    // 触发超时
    jest.advanceTimersByTime(501);

    await expect(generatePromise).rejects.toThrow('AI服务请求超时');
    
    jest.useRealTimers();
  });

  it('should handle API errors correctly', async () => {
    const errorResponse = {
      error: {
        message: 'Invalid API key'
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
      json: () => Promise.resolve(errorResponse)
    });

    const service = createLLMService(mockConfig);
    await expect(service.generate({
      prompt: '测试提示词'
    })).rejects.toThrow(/AI服务调用失败/);
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    const service = createLLMService(mockConfig);
    await expect(service.generate({
      prompt: '测试提示词'
    })).rejects.toThrow('AI服务错误: Network error');
  });

  it('should cancel ongoing requests', async () => {
    const service = createLLMService(mockConfig);
    const generatePromise = service.generate({
      prompt: '测试提示词'
    });

    service.cancel();

    await expect(generatePromise).rejects.toThrow('AI服务请求超时');
  });
}); 