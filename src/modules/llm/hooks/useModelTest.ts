import { useState, useCallback } from 'react';
import type { ChatRequest, ChatResponse } from '../api/types';
import type { ModelConfig } from '../types/config';
import { LLMError } from '../types/error';
import { LLMService } from '../services/LLMService';

interface UseModelTestProps {
  modelConfig: ModelConfig;
  onSuccess?: (response: ChatResponse) => void;
  onError?: (error: Error) => void;
  onStreamOutput?: (response: ChatResponse) => void;
}

interface UseModelTestResult {
  loading: boolean;
  error: Error | null;
  test: (message: string, systemPrompt?: string) => Promise<void>;
  testStream: (message: string, systemPrompt?: string) => Promise<void>;
}

export function useModelTest({
  modelConfig,
  onSuccess,
  onError,
  onStreamOutput
}: UseModelTestProps): UseModelTestResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const llmService = LLMService.getInstance();

  const handleError = useCallback((error: unknown) => {
    console.error('Model test error:', error);
    const llmError = error instanceof LLMError ? error : new Error(
      error instanceof Error ? error.message : '未知错误'
    );
    setError(llmError);
    onError?.(llmError);
    throw llmError;
  }, [onError]);

  const test = useCallback(async (message: string, systemPrompt?: string) => {
    setLoading(true);
    setError(null);

    try {
      // 初始化 provider 并设置模型
      await llmService.testModel(modelConfig);

      // 发送测试消息
      const response = await llmService.chat({
        message,
        systemPrompt,
        temperature: modelConfig.parameters.temperature,
        maxTokens: modelConfig.parameters.maxTokens,
        topP: modelConfig.parameters.topP,
        model: modelConfig.model
      });

      onSuccess?.(response);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [modelConfig, onSuccess, handleError, llmService]);

  const testStream = useCallback(async (message: string, systemPrompt?: string) => {
    setLoading(true);
    setError(null);

    try {
      // 初始化 provider 并设置模型
      await llmService.testModel(modelConfig);

      const stream = llmService.stream({
        message,
        systemPrompt,
        temperature: modelConfig.parameters.temperature,
        maxTokens: modelConfig.parameters.maxTokens,
        topP: modelConfig.parameters.topP,
        model: modelConfig.model,
        stream: true
      });

      for await (const response of stream) {
        onStreamOutput?.(response);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [modelConfig, onStreamOutput, handleError, llmService]);

  return {
    loading,
    error,
    test,
    testStream
  };
}

export default useModelTest; 