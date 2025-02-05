import { useState, useCallback, useRef } from 'react';
import type { UnifiedPlayer, Speech } from '../../types/adapters';

interface InnerThoughtsContext {
  player: UnifiedPlayer;
  role: "思考者";
  instruction: string;
  debateState: {
    topic: {
      title: string;
      background: string;
    };
    currentRound: number;
    totalRounds: number;
  };
  previousSpeeches: Speech[];
}

interface StreamingConfig {
  chunkSize?: number;
  delay?: number;
  onToken?: (token: string) => void;
  onComplete?: () => void;
}

interface UseInnerThoughtsReturn {
  // 状态
  thoughts: string;
  isGenerating: boolean;
  isStreaming: boolean;
  error: Error | null;
  progress: number; // 0-100

  // 操作
  generateThoughts: (context: InnerThoughtsContext) => Promise<string>;
  startStreaming: (content: string, config?: StreamingConfig) => void;
  stopStreaming: () => void;
  clearThoughts: () => void;
}

export const useInnerThoughts = (): UseInnerThoughtsReturn => {
  // 状态管理
  const [thoughts, setThoughts] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  // 流式输出控制
  const streamingRef = useRef<{
    content: string;
    currentIndex: number;
    intervalId?: NodeJS.Timeout;
  }>({ content: '', currentIndex: 0 });

  // 清理函数
  const cleanup = useCallback(() => {
    if (streamingRef.current.intervalId) {
      clearInterval(streamingRef.current.intervalId);
      streamingRef.current = { content: '', currentIndex: 0 };
    }
    setIsStreaming(false);
    setProgress(0);
  }, []);

  // 生成内心OS
  const generateThoughts = useCallback(async (
    context: InnerThoughtsContext
  ): Promise<string> => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const prompt = `你是一位专业的辩论选手，现在需要你以思考者的身份，分析当前辩论局势并思考策略。

你的角色信息：
- 姓名：${context.player.name}
- 性格：${context.player.personality || '未指定'}
- 说话风格：${context.player.speakingStyle || '未指定'}
- 专业背景：${context.player.background || '未指定'}

当前辩论信息：
- 主题：${context.debateState.topic.title}
- 背景：${context.debateState.topic.background}
- 当前轮次：${context.debateState.currentRound}/${context.debateState.totalRounds}
- 已有发言：
${context.previousSpeeches.map(speech => 
  `[${speech.playerId}]: ${speech.content}`
).join('\n')}

${context.instruction}

请以内心独白的方式，分析当前局势并思考下一步策略。注意：
1. 保持角色特征的一致性
2. 分析其他选手的论点优劣
3. 思考可能的反驳方向
4. 规划下一步的论证策略`;

      // TODO: 调用实际的AI服务
      const thoughts = '这是一个示例内心OS...';
      setThoughts(thoughts);
      return thoughts;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // 开始流式输出
  const startStreaming = useCallback((
    content: string,
    {
      chunkSize = 2,
      delay = 50,
      onToken,
      onComplete
    }: StreamingConfig = {}
  ) => {
    cleanup();
    
    setIsStreaming(true);
    streamingRef.current.content = content;
    
    const streamContent = () => {
      const { currentIndex, content } = streamingRef.current;
      
      if (currentIndex >= content.length) {
        cleanup();
        onComplete?.();
        return;
      }

      const chunk = content.slice(
        currentIndex,
        currentIndex + chunkSize
      );
      
      setThoughts(prev => prev + chunk);
      onToken?.(chunk);
      
      streamingRef.current.currentIndex += chunkSize;
      setProgress(Math.floor((currentIndex / content.length) * 100));
    };

    streamingRef.current.intervalId = setInterval(streamContent, delay);
  }, [cleanup]);

  // 停止流式输出
  const stopStreaming = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // 清除内心OS
  const clearThoughts = useCallback(() => {
    setThoughts('');
    cleanup();
  }, [cleanup]);

  return {
    thoughts,
    isGenerating,
    isStreaming,
    error,
    progress,
    generateThoughts,
    startStreaming,
    stopStreaming,
    clearThoughts
  };
}; 