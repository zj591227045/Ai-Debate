import { useState, useCallback } from 'react';
import { AIDebateService } from '../services/AIDebateService';
import { Character } from '../types/character';
import { DebateState } from '../types/debate';

interface UseAIDebateReturn {
  isGenerating: boolean;
  generateInnerThoughts: (character: Character, state: DebateState) => Promise<string>;
  generateSpeech: (character: Character, state: DebateState, innerThoughts: string) => Promise<string>;
  generateScore: (judge: Character, state: DebateState) => Promise<string>;
  error: Error | null;
}

export const useAIDebate = (): UseAIDebateReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const service = new AIDebateService();

  const generateInnerThoughts = useCallback(async (character: Character, state: DebateState) => {
    setIsGenerating(true);
    setError(null);
    try {
      const thoughts = await service.generateInnerThoughts(character, state);
      return thoughts;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('生成内心OS时发生未知错误');
      setError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateSpeech = useCallback(async (character: Character, state: DebateState, innerThoughts: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const speech = await service.generateSpeech(character, state, innerThoughts);
      return speech;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('生成正式发言时发生未知错误');
      setError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateScore = useCallback(async (judge: Character, state: DebateState) => {
    setIsGenerating(true);
    setError(null);
    try {
      const score = await service.generateScore(judge, state);
      return score;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('生成评分时发生未知错误');
      setError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    generateInnerThoughts,
    generateSpeech,
    generateScore,
    error
  };
}; 