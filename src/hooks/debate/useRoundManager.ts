import { useState, useCallback, useEffect } from 'react';

export interface RoundResult {
  round: number;
  scores: {
    playerId: string;
    roundScore: number;
    cumulativeScore: number;
    rank: number;
  }[];
  eliminated?: {
    playerId: string;
    reason: string;
    finalRank: number;
  }[];
}

export interface RoundConfig {
  type: 'structured' | 'free';    // 辩论类型
  totalRounds: number;            // 总轮次
  playerCount: number;            // 参与人数
  eliminationRules?: {           // 淘汰规则
    enabled: boolean;
    eliminatePerRound: number;
    minPlayers: number;
    tiebreaker: {
      criteria: ('averageScore' | 'totalScore' | 'innovation' | 'logic')[];
      random: boolean;
    };
  };
}

export interface RoundState {
  currentRound: number;
  speakingOrder: string[];       // 当前轮次发言顺序
  currentSpeaker?: string;       // 当前发言人
  completedSpeeches: {          // 已完成的发言
    playerId: string;
    speechId: string;
  }[];
  status: 'preparing' | 'speaking' | 'paused' | 'finished';
  scores: {                     // 本轮评分
    [playerId: string]: number;
  };
  eliminated?: {                // 本轮淘汰选手
    playerId: string;
    reason: string;
    finalRank: number;
  }[];
}

interface PlayerScore {
  playerId: string;
  score: number;
  totalScore: number;
  averageScore: number;
  innovation: number;
  logic: number;
}

interface UseRoundManagerProps {
  config: RoundConfig;
  players: {
    id: string;
    name: string;
    role?: string;
  }[];
  onRoundEnd?: (roundResult: RoundResult) => void;
  onPlayerEliminated?: (player: { id: string; reason: string; rank: number }) => void;
}

interface UseRoundManagerReturn {
  state: RoundState;
  startRound: () => void;
  pauseRound: () => void;
  resumeRound: () => void;
  endRound: () => void;
  nextSpeaker: () => void;
  addSpeech: (speechId: string) => void;
  addScore: (playerId: string, score: number) => void;
}

export function useRoundManager({
  config,
  players,
  onRoundEnd,
  onPlayerEliminated
}: UseRoundManagerProps): UseRoundManagerReturn {
  const [state, setState] = useState<RoundState>({
    currentRound: 0,
    speakingOrder: [],
    completedSpeeches: [],
    status: 'preparing',
    scores: {}
  });

  // 生成发言顺序
  const generateSpeakingOrder = useCallback(() => {
    if (config.type === 'structured') {
      // 结构化辩论按照固定顺序
      return players.map(p => p.id);
    } else {
      // 自由辩论随机顺序
      return [...players].sort(() => Math.random() - 0.5).map(p => p.id);
    }
  }, [config.type, players]);

  // 开始新一轮
  const startRound = useCallback(() => {
    const speakingOrder = generateSpeakingOrder();
    setState(prev => ({
      ...prev,
      currentRound: prev.currentRound + 1,
      speakingOrder,
      currentSpeaker: speakingOrder[0],
      completedSpeeches: [],
      status: 'speaking' as const,
      scores: {}
    }));
  }, [generateSpeakingOrder]);

  // 暂停当前轮次
  const pauseRound = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'paused' as const
    }));
  }, []);

  // 继续当前轮次
  const resumeRound = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'speaking' as const
    }));
  }, []);

  // 处理淘汰机制
  const handleElimination = useCallback(() => {
    if (!config.eliminationRules?.enabled) return undefined;

    const { eliminatePerRound, minPlayers, tiebreaker } = config.eliminationRules;
    const remainingPlayers = players.length - (state.eliminated?.length || 0);

    if (remainingPlayers <= minPlayers) return undefined;

    // 计算排名
    const rankings = Object.entries(state.scores)
      .map(([playerId, score]) => ({
        playerId,
        score,
        totalScore: 0, // TODO: 从历史记录计算总分
        averageScore: 0, // TODO: 从历史记录计算平均分
        innovation: 0,
        logic: 0
      } as PlayerScore))
      .sort((a, b) => {
        for (const criterion of tiebreaker.criteria) {
          const diff = b[criterion] - a[criterion];
          if (diff !== 0) return diff;
        }
        return tiebreaker.random ? Math.random() - 0.5 : 0;
      });

    // 确定淘汰人数
    const eliminateCount = Math.min(
      eliminatePerRound,
      remainingPlayers - minPlayers
    );

    // 返回淘汰名单
    return rankings.slice(-eliminateCount).map((player, index) => ({
      playerId: player.playerId,
      reason: '本轮得分最低',
      finalRank: remainingPlayers - index
    }));
  }, [config.eliminationRules, players.length, state.scores, state.eliminated]);

  // 结束当前轮次
  const endRound = useCallback(() => {
    setState(prev => {
      const eliminated = handleElimination();
      const newState: RoundState = {
        ...prev,
        status: 'finished',
        eliminated: eliminated || undefined
      };

      // 触发回调
      if (eliminated) {
        eliminated.forEach(player => {
          onPlayerEliminated?.({
            id: player.playerId,
            reason: player.reason,
            rank: player.finalRank
          });
        });
      }

      // 触发轮次结束回调
      onRoundEnd?.({
        round: prev.currentRound,
        scores: Object.entries(prev.scores).map(([playerId, score]) => ({
          playerId,
          roundScore: score,
          cumulativeScore: 0, // TODO: 从历史记录计算
          rank: 0 // TODO: 计算排名
        })),
        eliminated
      });

      return newState;
    });
  }, [handleElimination, onPlayerEliminated, onRoundEnd]);

  // 切换到下一个发言人
  const nextSpeaker = useCallback(() => {
    setState(prev => {
      const currentIndex = prev.speakingOrder.indexOf(prev.currentSpeaker!);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex >= prev.speakingOrder.length) {
        // 所有人都发言完毕，结束本轮
        return {
          ...prev,
          currentSpeaker: undefined,
          status: 'finished' as const
        };
      }

      return {
        ...prev,
        currentSpeaker: prev.speakingOrder[nextIndex]
      };
    });
  }, []);

  // 添加发言记录
  const addSpeech = useCallback((speechId: string) => {
    setState(prev => ({
      ...prev,
      completedSpeeches: [
        ...prev.completedSpeeches,
        {
          playerId: prev.currentSpeaker!,
          speechId
        }
      ]
    }));
  }, []);

  // 添加评分
  const addScore = useCallback((playerId: string, score: number) => {
    setState(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [playerId]: score
      }
    }));
  }, []);

  return {
    state,
    startRound,
    pauseRound,
    resumeRound,
    endRound,
    nextSpeaker,
    addSpeech,
    addScore
  };
}

export default useRoundManager;