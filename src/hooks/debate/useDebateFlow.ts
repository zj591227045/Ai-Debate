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
  const [state, setState] = useState<DebateFlowState | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [debateAdapter, setDebateAdapter] = useState<DebateFlowAdapter | null>(null);
  const [scoringAdapter, setScoringAdapter] = useState<ScoringAdapter | null>(null);

  // 初始化适配器
  useEffect(() => {
    if (!config) return;

    try {
      // 初始化所需的服务
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
      
      const newDebateAdapter = new DebateFlowAdapter(debateService);
      const newScoringAdapter = new ScoringAdapter(scoringSystem);

      setDebateAdapter(newDebateAdapter);
      setScoringAdapter(newScoringAdapter);

      // 订阅状态变更
      const unsubscribeState = newDebateAdapter.onStateChange((newState) => {
        setState(newState);
      });

      // 订阅评分生成
      const unsubscribeScore = newScoringAdapter.onScoreGenerated((score) => {
        setScores(prev => [...prev, score]);
      });

      // 初始化辩论
      newDebateAdapter.initialize(config).catch(setError);

      return () => {
        unsubscribeState();
        unsubscribeScore();
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('初始化失败'));
    }
  }, [config]);

  // 辩论控制动作
  const actions = {
    startDebate: useCallback(async () => {
      if (!debateAdapter) throw new Error('辩论流程未初始化');
      await debateAdapter.startDebate();
    }, [debateAdapter]),

    pauseDebate: useCallback(async () => {
      if (!debateAdapter) throw new Error('辩论流程未初始化');
      await debateAdapter.pauseDebate();
    }, [debateAdapter]),

    resumeDebate: useCallback(async () => {
      if (!debateAdapter) throw new Error('辩论流程未初始化');
      await debateAdapter.resumeDebate();
    }, [debateAdapter]),

    endDebate: useCallback(async () => {
      if (!debateAdapter) throw new Error('辩论流程未初始化');
      await debateAdapter.endDebate();
    }, [debateAdapter]),

    submitSpeech: useCallback(async (speech: SpeechInput) => {
      if (!debateAdapter) throw new Error('辩论流程未初始化');
      await debateAdapter.submitSpeech(speech);
    }, [debateAdapter]),

    skipCurrentSpeaker: useCallback(async () => {
      if (!debateAdapter) throw new Error('辩论流程未初始化');
      await debateAdapter.skipCurrentSpeaker();
    }, [debateAdapter]),

    startNextRound: useCallback(async () => {
      if (!debateAdapter) throw new Error('辩论流程未初始化');
      await debateAdapter.startNextRound();
    }, [debateAdapter])
  };

  return {
    state,
    scores,
    error,
    actions
  };
} 