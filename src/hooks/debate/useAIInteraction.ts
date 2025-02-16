import { useCallback, useState, useEffect } from 'react';
import type {
  UnifiedPlayer,
  Speech,
  Score,
  DebateStatus
} from '../../types/adapters';
import { useInnerThoughts } from './useInnerThoughts';
import { createDebateAIService } from '../../services/ai/debateAI';
import { createAIConfig } from '../../config/ai';
import { createTimestamp } from '../../utils/timestamp';

interface AIContext {
  player: UnifiedPlayer;
  debateState: {
    status: DebateStatus;
    currentRound: number;
    totalRounds: number;
    topic: {
      title: string;
      background: string;
    };
  };
  previousSpeeches: Speech[];
}

interface ScoringContext {
  judge: UnifiedPlayer;
  speech: Speech;
  scoringRules: {
    dimension: {
      id: string;
      name: string;
      weight: number;
      description: string;
      criteria: string[];
    };
    minScore: number;
    maxScore: number;
    guidelines: string[];
  }[];
}

interface UseAIInteractionProps {
  onError?: (error: Error) => void;
  retryConfig?: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
  };
}

interface UseAIInteractionReturn {
  // 发言生成
  generateSpeech: (context: AIContext) => Promise<{
    content: string;
    innerThoughts?: string;
  }>;
  
  // 评分生成
  generateScore: (context: ScoringContext) => Promise<Score>;
  
  // 状态
  isGenerating: boolean;
  error: Error | null;
  streamingProgress: number;
}

// AI响应重试策略
const defaultRetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 1.5
};

export const useAIInteraction = ({
  onError,
  retryConfig = defaultRetryConfig
}: UseAIInteractionProps = {}): UseAIInteractionReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // 创建AI服务实例
  const aiService = createDebateAIService(createAIConfig({
    timeout: retryConfig.maxDelay,
    maxRetries: retryConfig.maxAttempts
  }));
  
  // 集成内心OS Hook
  const {
    generateThoughts: generateInnerThoughtsStream,
    startStreaming,
    stopStreaming,
    isStreaming,
    progress: streamingProgress
  } = useInnerThoughts();

  // 执行重试策略
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    context: {
      type: 'thoughts' | 'speech' | 'score';
      playerId: string;
    }
  ): Promise<T> => {
    let attempt = 0;
    let lastError: Error = new Error('未知错误');

    while (attempt < retryConfig.maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt < retryConfig.maxAttempts) {
          const delay = Math.min(
            retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt),
            retryConfig.maxDelay
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    const finalError = new Error(
      `AI生成失败 (${context.type}) - 玩家ID: ${context.playerId}, 原因: ${lastError.message}`
    );
    setError(finalError);
    onError?.(finalError);
    throw finalError;
  }, [retryConfig, onError]);

  // 生成内心OS
  const generateInnerThoughts = useCallback(async (
    context: AIContext
  ): Promise<string> => {
    return executeWithRetry(
      () => aiService.generateThoughts({
        player: context.player,
        context: {
          topic: context.debateState.topic,
          currentRound: context.debateState.currentRound,
          totalRounds: context.debateState.totalRounds,
          previousSpeeches: context.previousSpeeches
        }
      }),
      { type: 'thoughts', playerId: context.player.id }
    );
  }, [aiService, executeWithRetry]);

  // 生成发言
  const generateSpeech = useCallback(async (
    context: AIContext
  ): Promise<{
    content: string;
    innerThoughts?: string;
  }> => {
    setIsGenerating(true);
    try {
      // 1. 生成内心OS
      const thoughts = await generateInnerThoughts(context);

      // 2. 开始流式输出内心OS
      startStreaming(thoughts, {
        chunkSize: 2,
        delay: 50,
        onComplete: () => {
          console.log('内心OS输出完成');
        }
      });

      // 3. 生成正式发言
      const content = await executeWithRetry(
        () => aiService.generateSpeech({
          player: context.player,
          thoughts,
          context: {
            topic: context.debateState.topic,
            currentRound: context.debateState.currentRound,
            totalRounds: context.debateState.totalRounds,
            previousSpeeches: context.previousSpeeches
          }
        }),
        { type: 'speech', playerId: context.player.id }
      );

      return {
        content,
        innerThoughts: thoughts
      };
    } finally {
      setIsGenerating(false);
      stopStreaming();
    }
  }, [
    aiService,
    executeWithRetry,
    generateInnerThoughts,
    startStreaming,
    stopStreaming
  ]);

  // 生成评分
  const generateScore = useCallback(async (
    context: ScoringContext
  ): Promise<Score> => {
    setIsGenerating(true);
    try {
      const scoreData = await executeWithRetry(
        () => aiService.generateScore({
          judge: context.judge,
          speech: context.speech,
          scoringRules: {
            dimensions: context.scoringRules.map(rule => ({
              id: rule.dimension.id,
              name: rule.dimension.name,
              weight: rule.dimension.weight,
              description: rule.dimension.description,
              criteria: rule.dimension.criteria
            })),
            minScore: context.scoringRules[0].minScore,
            maxScore: context.scoringRules[0].maxScore
          }
        }),
        { type: 'score', playerId: context.speech.playerId }
      );

      return {
        id: `score_${Date.now()}`,
        judgeId: context.judge.id,
        playerId: context.speech.playerId,
        speechId: context.speech.id,
        round: context.speech.round,
        timestamp: createTimestamp(),
        dimensions: scoreData.dimensions,
        totalScore: scoreData.totalScore,
        comment: scoreData.comment,
        feedback: {
          strengths: scoreData.feedback?.strengths || ['论点清晰'],
          weaknesses: scoreData.feedback?.weaknesses || ['可以进一步加强论证'],
          suggestions: scoreData.feedback?.suggestions || ['建议增加更多具体例证']
        }
      };
    } finally {
      setIsGenerating(false);
    }
  }, [aiService, executeWithRetry]);

  // 清理函数
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  return {
    generateSpeech,
    generateScore,
    isGenerating: isGenerating || isStreaming,
    error,
    streamingProgress
  };
}; 