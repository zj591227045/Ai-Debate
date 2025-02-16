import { useState, useCallback } from 'react';
import { AIDebateService } from '../services/AIDebateService';
import { Character } from '../types/character';
import { DebateState } from '../types/debate';
import { LLMError } from '../../llm/types/error';

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
      const response = await service.chat({
        message: '请生成内心独白',
        systemPrompt: `你是一位辩论选手，正在思考如何回应对方的观点。`
      });
      return response.content ?? '';
    } catch (error) {
      console.error('生成内心独白失败:', error);
      const err = error instanceof Error ? error : new Error('生成内心独白失败');
      setError(err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateSpeech = useCallback(async (character: Character, state: DebateState, innerThoughts: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await service.chat({
        message: '请生成正式发言',
        systemPrompt: `你是一位辩论选手，基于内心独白"${innerThoughts}"生成正式发言。`
      });
      return response.content ?? '';
    } catch (error) {
      console.error('生成正式发言失败:', error);
      const err = error instanceof Error ? error : new Error('生成正式发言失败');
      setError(err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateScore = useCallback(async (judge: Character, state: DebateState) => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await service.chat({
        message: '请对辩论表现进行评分',
        systemPrompt: '你是一位专业的辩论评委。'
      });
      return response.content ?? '';
    } catch (error) {
      console.error('生成评分失败:', error);
      const err = error instanceof Error ? error : new Error('生成评分失败');
      setError(err);
      throw err;
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