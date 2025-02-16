import { useState, useCallback, useEffect } from 'react';
import { ModelService } from '../services/ModelService';
import { ModelTestService } from '../services/ModelTestService';
import type { ModelConfig } from '../types/config';
import type { ProviderConfig } from '../types/config';
import type { ChatResponse } from '../../llm/api/types';
import { LLMError } from '../../llm/types/error';
import { LLMErrorCode } from '../../llm/types/error';

interface UseModelManagementReturn {
  // 状态
  models: ModelConfig[];
  providers: ProviderConfig[];
  loading: boolean;
  error: Error | null;
  testSessionId: string | null;

  // 模型管理操作
  addModel: (config: Omit<ModelConfig, 'id'>) => Promise<void>;
  updateModel: (id: string, updates: Partial<ModelConfig>) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
  toggleModelStatus: (id: string, enabled: boolean) => Promise<void>;
  
  // 测试操作
  startTest: (modelId: string) => Promise<void>;
  endTest: () => void;
  sendTestMessage: (message: string, systemPrompt?: string) => Promise<ChatResponse>;
  streamTestMessage: (message: string, systemPrompt?: string) => AsyncGenerator<ChatResponse>;
  clearTestHistory: () => void;
}

export function useModelManagement(): UseModelManagementReturn {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [testSessionId, setTestSessionId] = useState<string | null>(null);

  const modelService = new ModelService();
  const testService = new ModelTestService();

  // 加载初始数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [modelList, providerList] = await Promise.all([
          modelService.getAllModels(),
          modelService.getProviderConfigs()
        ]);
        setModels(modelList);
        setProviders(providerList);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('加载数据失败'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 添加模型
  const addModel = useCallback(async (config: Omit<ModelConfig, 'id'>) => {
    try {
      setLoading(true);
      const newModel = await modelService.addModel(config);
      setModels(prev => [...prev, newModel]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('添加模型失败'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新模型
  const updateModel = useCallback(async (id: string, updates: Partial<ModelConfig>) => {
    try {
      setLoading(true);
      const updated = await modelService.updateModel(id, updates);
      setModels(prev => prev.map(model => model.id === id ? updated : model));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('更新模型失败'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 删除模型
  const deleteModel = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await modelService.deleteModel(id);
      setModels(prev => prev.filter(model => model.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('删除模型失败'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 切换模型状态
  const toggleModelStatus = useCallback(async (id: string, enabled: boolean) => {
    try {
      setLoading(true);
      const updated = await modelService.toggleModelStatus(id, enabled);
      setModels(prev => prev.map(model => model.id === id ? updated : model));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('切换模型状态失败'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 开始测试
  const startTest = useCallback(async (modelId: string) => {
    try {
      const sessionId = await testService.createSession(modelId);
      setTestSessionId(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('开始测试失败'));
      throw err;
    }
  }, []);

  // 结束测试
  const endTest = useCallback(() => {
    if (testSessionId) {
      testService.deleteSession(testSessionId);
      setTestSessionId(null);
    }
  }, [testSessionId]);

  // 发送测试消息
  const sendTestMessage = useCallback(async (
    message: string,
    systemPrompt?: string
  ): Promise<ChatResponse> => {
    if (!testSessionId) {
      throw new LLMError(
        LLMErrorCode.SESSION_NOT_FOUND,
        '没有活动的测试会话'
      );
    }

    try {
      return await testService.sendMessage(testSessionId, message, systemPrompt);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('发送消息失败'));
      throw err;
    }
  }, [testSessionId]);

  // 流式测试消息
  const streamTestMessage = useCallback(async function* (
    message: string,
    systemPrompt?: string
  ): AsyncGenerator<ChatResponse> {
    if (!testSessionId) {
      throw new LLMError(
        LLMErrorCode.SESSION_NOT_FOUND,
        '没有活动的测试会话'
      );
    }

    try {
      yield* testService.streamMessage(testSessionId, message, systemPrompt);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('流式消息失败'));
      throw err;
    }
  }, [testSessionId]);

  // 清除测试历史
  const clearTestHistory = useCallback(() => {
    if (testSessionId) {
      testService.clearSession(testSessionId);
    }
  }, [testSessionId]);

  return {
    models,
    providers,
    loading,
    error,
    testSessionId,
    addModel,
    updateModel,
    deleteModel,
    toggleModelStatus,
    startTest,
    endTest,
    sendTestMessage,
    streamTestMessage,
    clearTestHistory
  };
} 