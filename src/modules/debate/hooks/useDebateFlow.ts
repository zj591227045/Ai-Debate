import { useState, useEffect, useCallback } from 'react';
import type { DebateConfig } from '@game-config/types';
import type { Speech } from '@debate/types';
import { DebateRoomAdapter } from '@debate-flow/adapters/DebateRoomAdapter';
import type { DebateFlowState } from '@debate-flow/types/interfaces';

export function useDebateFlow(config?: DebateConfig) {
  const [adapter] = useState(() => new DebateRoomAdapter());
  const [state, setState] = useState<DebateFlowState>();
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (config) {
      adapter.initialize(config).catch(setError);
    }
  }, [adapter, config]);

  useEffect(() => {
    const unsubscribe = adapter.subscribeToStateChange(setState);
    return () => unsubscribe();
  }, [adapter]);

  const startDebate = useCallback(async () => {
    try {
      await adapter.startDebate();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [adapter]);

  const pauseDebate = useCallback(async () => {
    try {
      await adapter.pauseDebate();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [adapter]);

  const resumeDebate = useCallback(async () => {
    try {
      await adapter.resumeDebate();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [adapter]);

  const endDebate = useCallback(async () => {
    try {
      await adapter.endDebate();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [adapter]);

  const submitSpeech = useCallback(async (speech: Speech) => {
    try {
      await adapter.submitSpeech(speech);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [adapter]);

  return {
    state,
    error,
    actions: {
      startDebate,
      pauseDebate,
      resumeDebate,
      endDebate,
      submitSpeech
    }
  };
} 