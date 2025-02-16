import { useState, useCallback } from 'react';
import type { ModelConfig } from '../types/config';
import { UnifiedLLMService } from '../../llm/services/UnifiedLLMService';
import { StreamResponse } from '../../llm/types/common';
import { LLMError, LLMErrorCode } from '../../llm/types/error';

interface UseModelTestProps {
  modelConfig: ModelConfig;
  onStreamOutput: (response: StreamResponse) => void;
  onError: (error: Error) => void;
}

interface UseModelTestReturn {
  sendMessage: (message: string, systemPrompt?: string) => Promise<void>;
  testStream: (message: string, systemPrompt?: string) => Promise<void>;
  isLoading: boolean;
}

export function useModelTest({
  modelConfig,
  onStreamOutput,
  onError
}: UseModelTestProps): UseModelTestReturn {
  const [isLoading, setIsLoading] = useState(false);
  const llmService = UnifiedLLMService.getInstance();

  const sendMessage = useCallback(async (message: string, systemPrompt?: string) => {
    setIsLoading(true);
    try {
      await llmService.setModelConfig(modelConfig);
      const response = await llmService.chat({
        message,
        systemPrompt,
        temperature: modelConfig.parameters.temperature,
        maxTokens: modelConfig.parameters.maxTokens,
        topP: modelConfig.parameters.topP
      });
      
      onStreamOutput({
        content: response.content || '',
        metadata: response.metadata
      });
    } catch (error) {
      console.error('发送消息失败:', error);
      onError(error instanceof Error ? error : new LLMError(LLMErrorCode.REQUEST_FAILED, '发送消息失败'));
    } finally {
      setIsLoading(false);
    }
  }, [modelConfig, onStreamOutput, onError]);

  const testStream = useCallback(async (message: string, systemPrompt?: string) => {
    setIsLoading(true);
    try {
      await llmService.setModelConfig(modelConfig);
      const stream = llmService.stream({
        message,
        systemPrompt,
        temperature: modelConfig.parameters.temperature,
        maxTokens: modelConfig.parameters.maxTokens,
        topP: modelConfig.parameters.topP,
        stream: true
      });

      for await (const response of stream) {
        onStreamOutput({
          content: response.content || '',
          metadata: response.metadata
        });
      }
    } catch (error) {
      console.error('流式测试失败:', error);
      onError(error instanceof Error ? error : new LLMError(LLMErrorCode.STREAM_ERROR, '流式测试失败'));
    } finally {
      setIsLoading(false);
    }
  }, [modelConfig, onStreamOutput, onError]);

  return {
    sendMessage,
    testStream,
    isLoading
  };
} 