/**
 * 辩论服务 Hook
 */

import { useState, useCallback } from 'react';
import { DebateService } from '../services/DebateService';
import { DebateRequest, DebateResponse, Debater, DebateContext } from '../types';

interface UseDebateServiceProps {
  debater: Debater;
  context: DebateContext;
  onSuccess?: (response: DebateResponse) => void;
  onError?: (error: Error) => void;
  onStreamOutput?: (chunk: string, isReasoning?: boolean) => void;
}

interface UseDebateServiceResult {
  loading: boolean;
  error: Error | null;
  generateSpeech: (systemPrompt?: string) => Promise<void>;
  generateSpeechStream: (systemPrompt?: string) => Promise<void>;
}

export function useDebateService({
  debater,
  context,
  onSuccess,
  onError,
  onStreamOutput
}: UseDebateServiceProps): UseDebateServiceResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debateService = DebateService.getInstance();

  const handleError = useCallback((error: unknown) => {
    console.error('辩论服务错误:', error);
    const finalError = error instanceof Error ? error : new Error('未知错误');
    setError(finalError);
    onError?.(finalError);
  }, [onError]);

  const generateSpeech = useCallback(async (systemPrompt?: string) => {
    console.group('=== 生成辩论发言 ===');
    console.log('辩手信息:', debater);
    console.log('上下文:', context);
    console.log('系统提示词:', systemPrompt);

    setLoading(true);
    setError(null);

    try {
      const request: DebateRequest = {
        debater,
        context,
        systemPrompt
      };

      const response = await debateService.generateSpeech(request);
      console.log('生成的发言:', response);
      onSuccess?.(response);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  }, [debater, context, onSuccess, handleError]);

  const generateSpeechStream = useCallback(async (systemPrompt?: string) => {
    console.group('=== 生成流式辩论发言 ===');
    console.log('辩手信息:', debater);
    console.log('上下文:', context);
    console.log('系统提示词:', systemPrompt);

    setLoading(true);
    setError(null);

    try {
      const request: DebateRequest = {
        debater,
        context,
        systemPrompt,
        stream: true
      };

      let isReasoningMode = false;
      let reasoningBuffer = '';
      let contentBuffer = '';

      for await (const chunk of debateService.generateSpeechStream(request)) {
        console.log('流式输出块:', chunk);

        // 检查是否包含思考标记
        if (chunk.includes('<think>')) {
          if (contentBuffer) {
            onStreamOutput?.(contentBuffer, false);
            contentBuffer = '';
          }
          isReasoningMode = true;
          continue;
        }

        if (chunk.includes('</think>')) {
          if (reasoningBuffer) {
            onStreamOutput?.(reasoningBuffer, true);
            reasoningBuffer = '';
          }
          isReasoningMode = false;
          continue;
        }

        // 根据当前模式，将内容添加到对应的缓冲区
        if (isReasoningMode) {
          reasoningBuffer += chunk;
          if (reasoningBuffer.length > 100) {
            onStreamOutput?.(reasoningBuffer, true);
            reasoningBuffer = '';
          }
        } else {
          contentBuffer += chunk;
          if (contentBuffer.length > 100) {
            onStreamOutput?.(contentBuffer, false);
            contentBuffer = '';
          }
        }
      }

      // 输出剩余的缓冲区内容
      if (reasoningBuffer) {
        onStreamOutput?.(reasoningBuffer, true);
      }
      if (contentBuffer) {
        onStreamOutput?.(contentBuffer, false);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  }, [debater, context, onStreamOutput, handleError]);

  return {
    loading,
    error,
    generateSpeech,
    generateSpeechStream
  };
} 