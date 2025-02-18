import { useState, useEffect, useCallback } from 'react';
import { DebateFlowAdapter } from '../../modules/debate-flow/adapters/DebateFlowAdapter';
import { ScoringAdapter } from '../../modules/debate-flow/adapters/ScoringAdapter';
import { DebateFlowService } from '../../modules/debate-flow/services/DebateFlowService';
import { ScoringSystem } from '../../modules/debate-flow/services/ScoringSystem';
import { LLMService } from '../../modules/debate-flow/services/LLMService';
import { SpeakingOrderManager } from '../../modules/debate-flow/services/SpeakingOrderManager';
import { SpeechProcessor } from '../../modules/debate-flow/services/SpeechProcessor';
import type {
  DebateFlowConfig,
  DebateFlowState,
  SpeechInput,
  Score
} from '../../modules/debate-flow/types/interfaces';
import { DebateFlowEvent } from '../../modules/debate-flow/types/events';

interface UseDebateFlowResult {
  state: DebateFlowState | null;
  scores: Score[];
  error: Error | null;
  actions: {
    startDebate: () => Promise<void>;
    pauseDebate: () => Promise<void>;
    resumeDebate: () => Promise<void>;
    endDebate: () => Promise<void>;
    submitSpeech: (speech: SpeechInput) => Promise<void>;
    skipCurrentSpeaker: () => Promise<void>;
    startNextRound: () => Promise<void>;
  };
}

export function useDebateFlow(config?: DebateFlowConfig): UseDebateFlowResult {
  // 创建所需的服务实例
  const [adapter] = useState(() => {
    const llmService = new LLMService();
    const speakingOrderManager = new SpeakingOrderManager();
    const speechProcessor = new SpeechProcessor();
    const scoringSystem = new ScoringSystem(llmService);
    
    // 创建辩论流程服务
    const debateService = new DebateFlowService(
      llmService,
      speakingOrderManager,
      speechProcessor,
      scoringSystem
    );
    
    return new DebateFlowAdapter(debateService);
  });
  const [state, setState] = useState<DebateFlowState | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [scoringAdapter, setScoringAdapter] = useState<ScoringAdapter | null>(null);

  // 使用useCallback优化状态更新函数
  const handleStateChange = useCallback((newState: DebateFlowState) => {
    setState(prev => {
      // 如果没有前一个状态，直接更新
      if (!prev) return newState;

      // 检查是否有流式内容更新
      const hasStreamingContent = 
        newState.currentSpeech?.status === 'streaming' &&
        newState.currentSpeech.content !== prev.currentSpeech?.content;

      // 如果是流式内容，立即更新并添加强制更新标记
      if (hasStreamingContent) {
        return {
          ...newState,
          _forceUpdate: Math.random(),
          _timestamp: Date.now()
        };
      }

      // 对于非流式内容，检查其他状态变化
      if (prev.status !== newState.status ||
          prev.currentRound !== newState.currentRound ||
          prev.currentSpeech?.status !== newState.currentSpeech?.status ||
          prev.currentSpeaker?.id !== newState.currentSpeaker?.id ||
          prev.nextSpeaker?.id !== newState.nextSpeaker?.id) {
        return {
          ...newState,
          _timestamp: Date.now()
        };
      }

      return prev;
    });
  }, []);

  useEffect(() => {
    if (config) {
      adapter.initialize(config).catch(setError);
    }
  }, [adapter, config]);

  useEffect(() => {
    const unsubscribe = adapter.onStateChange(handleStateChange);
    return () => unsubscribe();
  }, [adapter, handleStateChange]);

  // 辩论控制动作
  const actions = {
    startDebate: useCallback(async () => {
      if (!adapter) throw new Error('辩论流程未初始化');
      await adapter.startDebate();
    }, [adapter]),

    pauseDebate: useCallback(async () => {
      if (!adapter) throw new Error('辩论流程未初始化');
      await adapter.pauseDebate();
    }, [adapter]),

    resumeDebate: useCallback(async () => {
      if (!adapter) throw new Error('辩论流程未初始化');
      await adapter.resumeDebate();
    }, [adapter]),

    endDebate: useCallback(async () => {
      if (!adapter) throw new Error('辩论流程未初始化');
      await adapter.endDebate();
    }, [adapter]),

    submitSpeech: useCallback(async (speech: SpeechInput) => {
      if (!adapter) throw new Error('辩论流程未初始化');
      await adapter.submitSpeech(speech);
    }, [adapter]),

    skipCurrentSpeaker: useCallback(async () => {
      if (!adapter) throw new Error('辩论流程未初始化');
      await adapter.skipCurrentSpeaker();
    }, [adapter]),

    startNextRound: useCallback(async () => {
      if (!adapter) throw new Error('辩论流程未初始化');
      await adapter.startNextRound();
    }, [adapter])
  };

  return {
    state,
    scores,
    error,
    actions
  };
} 