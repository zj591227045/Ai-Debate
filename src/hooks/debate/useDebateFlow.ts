import { useState, useCallback } from 'react';
import type {
  DebateStatus,
  Speech,
  Score,
  UnifiedPlayer,
  DebateProgress,
  DebateHistory,
  DebateEvent,
  DebateEventType
} from '../../types/adapters';
import { createTimestamp } from '../../utils/timestamp';

interface UseDebateFlowProps {
  players: UnifiedPlayer[];
  totalRounds: number;
  format: 'structured' | 'free';
  onStateChange?: (state: DebateStatus) => void;
  onRoundChange?: (round: number) => void;
  onSpeakerChange?: (speakerId: string) => void;
}

interface UseDebateFlowReturn {
  // 状态
  status: DebateStatus;
  progress: DebateProgress;
  history: DebateHistory;
  
  // 流程控制
  startDebate: () => void;
  pauseDebate: () => void;
  resumeDebate: () => void;
  endDebate: () => void;
  
  // 发言管理
  nextSpeaker: () => void;
  nextRound: () => void;
  addSpeech: (speech: Omit<Speech, 'id' | 'timestamp'>) => void;
  addScore: (score: Omit<Score, 'id' | 'timestamp'>) => void;
  
  // 工具函数
  getPlayerName: (playerId: string) => string;
  getCurrentSpeaker: () => UnifiedPlayer | undefined;
  getNextSpeaker: () => UnifiedPlayer | undefined;
}

export const useDebateFlow = ({
  players,
  totalRounds,
  format,
  onStateChange,
  onRoundChange,
  onSpeakerChange
}: UseDebateFlowProps): UseDebateFlowReturn => {
  // 基础状态
  const [status, setStatus] = useState<DebateStatus>('preparing');
  const [progress, setProgress] = useState<DebateProgress>({
    currentRound: 1,
    totalRounds,
    speakingOrder: []
  });
  const [history, setHistory] = useState<DebateHistory>({
    speeches: [],
    scores: [],
    events: []
  });

  // 生成发言顺序
  const generateSpeakingOrder = useCallback(() => {
    if (format === 'structured') {
      // 结构化辩论按照固定顺序
      return players
        .filter(p => p.role !== 'judge')
        .map(p => p.id);
    } else {
      // 自由辩论模式下所有参与者都是free角色
      return players
        .filter(p => p.role === 'free' || p.role === 'unassigned')
        .map(p => p.id)
        .sort(() => Math.random() - 0.5);
    }
  }, [players, format]);

  // 添加事件记录
  const addEvent = useCallback((type: DebateEventType, data?: any) => {
    setHistory(prev => ({
      ...prev,
      events: [
        ...prev.events,
        {
          type,
          timestamp: createTimestamp(),
          data
        }
      ]
    }));
  }, []);

  // 流程控制函数
  const startDebate = useCallback(() => {
    const speakingOrder = generateSpeakingOrder();
    setProgress(prev => ({
      ...prev,
      speakingOrder,
      currentSpeaker: speakingOrder[0],
      nextSpeaker: speakingOrder[1]
    }));
    setStatus('ongoing');
    addEvent('debate_start');
    onStateChange?.('ongoing');
  }, [generateSpeakingOrder, addEvent, onStateChange]);

  const pauseDebate = useCallback(() => {
    setStatus('paused');
    addEvent('debate_pause');
    onStateChange?.('paused');
  }, [addEvent, onStateChange]);

  const resumeDebate = useCallback(() => {
    setStatus('ongoing');
    addEvent('debate_resume');
    onStateChange?.('ongoing');
  }, [addEvent, onStateChange]);

  const endDebate = useCallback(() => {
    setStatus('finished');
    addEvent('debate_end');
    onStateChange?.('finished');
  }, [addEvent, onStateChange]);

  // 发言管理函数
  const nextSpeaker = useCallback(() => {
    setProgress(prev => {
      const currentIndex = prev.speakingOrder.indexOf(prev.currentSpeaker || '');
      const nextIndex = currentIndex + 1;
      const nextSpeakerId = prev.speakingOrder[nextIndex];
      const afterNextSpeakerId = prev.speakingOrder[nextIndex + 1];

      return {
        ...prev,
        currentSpeaker: nextSpeakerId,
        nextSpeaker: afterNextSpeakerId
      };
    });
    addEvent('speech_end');
    onSpeakerChange?.(progress.nextSpeaker || '');
  }, [addEvent, progress.nextSpeaker, onSpeakerChange]);

  const nextRound = useCallback(() => {
    if (progress.currentRound < totalRounds) {
      const speakingOrder = generateSpeakingOrder();
      setProgress(prev => ({
        ...prev,
        currentRound: prev.currentRound + 1,
        speakingOrder,
        currentSpeaker: speakingOrder[0],
        nextSpeaker: speakingOrder[1]
      }));
      addEvent('round_end');
      addEvent('round_start', { round: progress.currentRound + 1 });
      onRoundChange?.(progress.currentRound + 1);
    }
  }, [
    progress.currentRound,
    totalRounds,
    generateSpeakingOrder,
    addEvent,
    onRoundChange
  ]);

  // 记录管理函数
  const addSpeech = useCallback((speech: Omit<Speech, 'id' | 'timestamp'>) => {
    const newSpeech: Speech = {
      ...speech,
      id: `speech_${Date.now()}`,
      timestamp: createTimestamp(),
      references: speech.references || []
    };
    setHistory(prev => ({
      ...prev,
      speeches: [...prev.speeches, newSpeech]
    }));
    addEvent('speech_start', { speechId: newSpeech.id });
  }, [addEvent]);

  const addScore = useCallback((score: Omit<Score, 'id' | 'timestamp'>) => {
    const newScore: Score = {
      ...score,
      id: `score_${Date.now()}`,
      timestamp: createTimestamp()
    };
    setHistory(prev => ({
      ...prev,
      scores: [...prev.scores, newScore]
    }));
  }, []);

  // 工具函数
  const getPlayerName = useCallback((playerId: string) => {
    return players.find(p => p.id === playerId)?.name || playerId;
  }, [players]);

  const getCurrentSpeaker = useCallback(() => {
    return players.find(p => p.id === progress.currentSpeaker);
  }, [players, progress.currentSpeaker]);

  const getNextSpeaker = useCallback(() => {
    return players.find(p => p.id === progress.nextSpeaker);
  }, [players, progress.nextSpeaker]);

  // 返回接口
  return {
    status,
    progress,
    history,
    startDebate,
    pauseDebate,
    resumeDebate,
    endDebate,
    nextSpeaker,
    nextRound,
    addSpeech,
    addScore,
    getPlayerName,
    getCurrentSpeaker,
    getNextSpeaker
  };
}; 