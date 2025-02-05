import { createDebateAIService } from '../debateAI';
import { createLLMService } from '../llmService';

// Mock LLM服务
jest.mock('../llmService');

describe('DebateAIService', () => {
  const mockConfig = {
    baseURL: 'http://test-api.com',
    apiKey: 'test-key',
    timeout: 1000,
    maxRetries: 3
  };

  const mockPlayer = {
    id: 'player1',
    name: '测试选手',
    role: 'affirmative',
    isAI: true,
    status: 'ready',
    personality: '严谨理性',
    speakingStyle: '逻辑清晰',
    background: '哲学专业',
    values: '追求真理',
    argumentationStyle: '系统论证'
  };

  const mockContext = {
    topic: {
      title: '测试辩题',
      background: '测试背景'
    },
    currentRound: 1,
    totalRounds: 3,
    previousSpeeches: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createLLMService as jest.Mock).mockReturnValue({
      generate: jest.fn(),
      cancel: jest.fn()
    });
  });

  describe('generateThoughts', () => {
    it('should generate thoughts successfully', async () => {
      const mockResponse = {
        text: '这是一段内心OS',
        usage: { totalTokens: 100 }
      };

      const llmService = createLLMService(mockConfig);
      (llmService.generate as jest.Mock).mockResolvedValueOnce(mockResponse);

      const service = createDebateAIService(mockConfig);
      const result = await service.generateThoughts({
        player: mockPlayer,
        context: mockContext
      });

      expect(result).toBe('这是一段内心OS');
      expect(llmService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.8,
          maxTokens: 500,
          stopSequences: ['[END]']
        })
      );
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        text: '',
        usage: { totalTokens: 0 }
      };

      const llmService = createLLMService(mockConfig);
      (llmService.generate as jest.Mock).mockResolvedValueOnce(mockResponse);

      const service = createDebateAIService(mockConfig);
      await expect(service.generateThoughts({
        player: mockPlayer,
        context: mockContext
      })).rejects.toThrow('AI返回了空的内心OS');
    });
  });

  describe('generateSpeech', () => {
    it('should generate speech successfully', async () => {
      const mockResponse = {
        text: '这是一段正式发言',
        usage: { totalTokens: 100 }
      };

      const llmService = createLLMService(mockConfig);
      (llmService.generate as jest.Mock).mockResolvedValueOnce(mockResponse);

      const service = createDebateAIService(mockConfig);
      const result = await service.generateSpeech({
        player: mockPlayer,
        thoughts: '之前的思考',
        context: mockContext
      });

      expect(result).toBe('这是一段正式发言');
      expect(llmService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.6,
          maxTokens: 800,
          stopSequences: ['[END]']
        })
      );
    });
  });

  describe('generateScore', () => {
    const mockJudge = {
      id: 'judge1',
      name: '测试评委',
      role: 'judge',
      isAI: true,
      status: 'ready',
      background: '辩论专家'
    };

    const mockSpeech = {
      id: 'speech1',
      playerId: 'player1',
      content: '测试发言',
      round: 1,
      timestamp: Date.now(),
      references: []
    };

    const mockScoringRules = {
      dimensions: [{
        id: 'logic',
        name: '逻辑性',
        weight: 0.4,
        description: '论证的逻辑性',
        criteria: ['论证完整', '逻辑清晰']
      }],
      minScore: 0,
      maxScore: 100
    };

    it('should generate score successfully', async () => {
      const mockResponse = {
        text: JSON.stringify({
          dimensions: { logic: 85 },
          totalScore: 85,
          comment: '逻辑清晰，论证有力'
        }),
        usage: { totalTokens: 100 }
      };

      const llmService = createLLMService(mockConfig);
      (llmService.generate as jest.Mock).mockResolvedValueOnce(mockResponse);

      const service = createDebateAIService(mockConfig);
      const result = await service.generateScore({
        judge: mockJudge,
        speech: mockSpeech,
        scoringRules: mockScoringRules
      });

      expect(result).toEqual({
        dimensions: { logic: 85 },
        totalScore: 85,
        comment: '逻辑清晰，论证有力'
      });
      expect(llmService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3,
          maxTokens: 500,
          stopSequences: ['}']
        })
      );
    });

    it('should handle invalid score format', async () => {
      const mockResponse = {
        text: JSON.stringify({
          dimensions: { logic: 150 }, // 超出范围的分数
          totalScore: 150,
          comment: '测试评语'
        }),
        usage: { totalTokens: 100 }
      };

      const llmService = createLLMService(mockConfig);
      (llmService.generate as jest.Mock).mockResolvedValueOnce(mockResponse);

      const service = createDebateAIService(mockConfig);
      await expect(service.generateScore({
        judge: mockJudge,
        speech: mockSpeech,
        scoringRules: mockScoringRules
      })).rejects.toThrow('评分范围不正确');
    });
  });

  describe('error handling', () => {
    it('should handle LLM service errors', async () => {
      const llmService = createLLMService(mockConfig);
      (llmService.generate as jest.Mock).mockRejectedValueOnce(
        new Error('LLM service error')
      );

      const service = createDebateAIService(mockConfig);
      await expect(service.generateThoughts({
        player: mockPlayer,
        context: mockContext
      })).rejects.toThrow('生成内心OS失败: LLM service error');
    });

    it('should handle request cancellation', () => {
      const service = createDebateAIService(mockConfig);
      service.cancel();
      
      const llmService = createLLMService(mockConfig);
      expect(llmService.cancel).toHaveBeenCalled();
    });
  });
}); 