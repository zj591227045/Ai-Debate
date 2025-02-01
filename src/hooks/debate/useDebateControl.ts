import { useState, useCallback } from 'react';

export type DebateStatus = 'preparing' | 'ongoing' | 'paused' | 'finished';

interface DebateState {
  status: DebateStatus;
  currentRound: number;
  totalRounds: number;
  startTime?: Date;
  endTime?: Date;
  pausedTime?: Date;
  totalPausedDuration: number; // 总暂停时长（毫秒）
}

interface UseDebateControlProps {
  totalRounds?: number;
  onStatusChange?: (status: DebateStatus) => void;
  onRoundChange?: (round: number) => void;
}

interface UseDebateControlReturn {
  state: DebateState;
  startDebate: () => void;
  pauseDebate: () => void;
  resumeDebate: () => void;
  endDebate: () => void;
  isActive: boolean;
  duration: number; // 辩论持续时间（毫秒）
}

export function useDebateControl({
  totalRounds = 3,
  onStatusChange,
  onRoundChange
}: UseDebateControlProps = {}): UseDebateControlReturn {
  const [state, setState] = useState<DebateState>({
    status: 'preparing',
    currentRound: 0,
    totalRounds,
    totalPausedDuration: 0
  });

  const startDebate = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'ongoing',
      startTime: new Date(),
      currentRound: 1
    }));
    onStatusChange?.('ongoing');
    onRoundChange?.(1);
  }, [onStatusChange, onRoundChange]);

  const pauseDebate = useCallback(() => {
    if (state.status !== 'ongoing') return;
    setState(prev => ({
      ...prev,
      status: 'paused',
      pausedTime: new Date()
    }));
    onStatusChange?.('paused');
  }, [state.status, onStatusChange]);

  const resumeDebate = useCallback(() => {
    if (state.status !== 'paused' || !state.pausedTime) return;
    const pauseDuration = new Date().getTime() - state.pausedTime.getTime();
    setState(prev => ({
      ...prev,
      status: 'ongoing',
      pausedTime: undefined,
      totalPausedDuration: prev.totalPausedDuration + pauseDuration
    }));
    onStatusChange?.('ongoing');
  }, [state.status, state.pausedTime, onStatusChange]);

  const endDebate = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'finished',
      endTime: new Date()
    }));
    onStatusChange?.('finished');
  }, [onStatusChange]);

  const duration = (() => {
    if (!state.startTime) return 0;
    const end = state.endTime || new Date();
    return end.getTime() - state.startTime.getTime() - state.totalPausedDuration;
  })();

  const isActive = state.status === 'ongoing';

  return {
    state,
    startDebate,
    pauseDebate,
    resumeDebate,
    endDebate,
    isActive,
    duration
  };
}

export default useDebateControl; 