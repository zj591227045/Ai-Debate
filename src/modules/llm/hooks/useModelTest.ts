import { useState, useCallback } from 'react';
import { TestService, TestRequest, TestContext } from '../services/TestService';
import { ModelConfig } from '../types';
import { LLMError, LLMErrorCode } from '../types/error';

interface UseModelTestProps {
  modelConfig: ModelConfig;
  context?: TestContext;
  onSuccess?: (content: string) => void;
  onError?: (error: Error) => void;
  onStreamOutput?: (chunk: string, isReasoning?: boolean) => void;
}

interface UseModelTestResult {
  loading: boolean;
  error: Error | null;
  test: (input: string, prompt?: string) => Promise<void>;
  testStream: (input: string, prompt?: string) => Promise<void>;
}

export function useModelTest({
  modelConfig,
  context,
  onSuccess,
  onError,
  onStreamOutput
}: UseModelTestProps): UseModelTestResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const testService = TestService.getInstance();

  console.log('=== useModelTest Hook Initialized ===');
  console.log('Model Config:', modelConfig);
  console.log('Context:', context);

  const handleError = useCallback((error: unknown) => {
    console.error('=== useModelTest Error ===', error);
    const llmError = error instanceof LLMError ? error : new LLMError(
      error instanceof Error ? error.message : '未知错误',
      LLMErrorCode.UNKNOWN,
      modelConfig.provider,
      error instanceof Error ? error : undefined
    );
    setError(llmError);
    onError?.(llmError);
  }, [modelConfig.provider, onError]);

  const test = useCallback(async (input: string, prompt?: string) => {
    console.group('=== useModelTest Test Request ===');
    console.log('Input:', input);
    console.log('Prompt:', prompt);
    console.groupEnd();

    setLoading(true);
    setError(null);

    try {
      const request: TestRequest = {
        input,
        prompt,
        modelConfig,
        context
      };

      const response = await testService.test(request);
      console.log('=== useModelTest Test Response ===', response);
      onSuccess?.(response.content);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [modelConfig, context, onSuccess, handleError]);

  const testStream = useCallback(async (input: string, prompt?: string) => {
    console.group('=== useModelTest Stream Request ===');
    console.log('Input:', input);
    console.log('Prompt:', prompt);
    console.groupEnd();

    setLoading(true);
    setError(null);

    try {
      const request: TestRequest = {
        input,
        prompt,
        modelConfig,
        context,
        stream: true
      };

      let isReasoningMode = false;
      for await (const chunk of testService.testStream(request)) {
        console.log('Stream Chunk:', chunk);
        
        // 检查是否包含推理标记
        if (chunk.startsWith('[[REASONING_START]]')) {
          isReasoningMode = true;
          continue;
        }
        if (chunk.startsWith('[[REASONING_END]]')) {
          isReasoningMode = false;
          continue;
        }
        
        onStreamOutput?.(chunk, isReasoningMode);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [modelConfig, context, onStreamOutput, handleError]);

  return {
    loading,
    error,
    test,
    testStream
  };
} 