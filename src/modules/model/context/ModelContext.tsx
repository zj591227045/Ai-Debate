import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ModelConfig } from '../types';
import { ModelStorageService } from '../services/ModelStorageService';

interface ModelContextType {
  models: ModelConfig[];
  isLoading: boolean;
  error: string | null;
  addModel: (model: Omit<ModelConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateModel: (id: string, model: Partial<ModelConfig>) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
  toggleModel: (id: string, isEnabled: boolean) => Promise<void>;
  importConfigs: (configs: ModelConfig[]) => Promise<void>;
  exportConfigs: () => Promise<ModelConfig[]>;
  refreshModels: () => Promise<void>;
}

const ModelContext = createContext<ModelContextType | null>(null);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storageService = ModelStorageService.getInstance();

  const refreshModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    //console.log('开始刷新模型列表');
    try {
      const configs = await storageService.getAll();
      //console.log('获取到的模型配置:', configs);
      
      if (!Array.isArray(configs)) {
        //console.error('获取到的配置不是数组格式');
        setError('获取模型配置失败：数据格式错误');
        setModels([]);
        return;
      }
      
      if (configs.length === 0) {
        //console.log('没有找到任何模型配置');
      }
      
      setModels(configs);
      //console.log('模型列表已更新:', configs);
    } catch (err) {
      //console.error('加载模型配置失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
      setModels([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addModel = async (model: Omit<ModelConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await storageService.add(model);
      await refreshModels();
    } catch (err) {
      //console.error('添加模型失败:', err);
      throw err;
    }
  };

  const updateModel = async (id: string, model: Partial<ModelConfig>) => {
    try {
      await storageService.update(id, model);
      await refreshModels();
    } catch (err) {
      //console.error('更新模型失败:', err);
      throw err;
    }
  };

  const deleteModel = async (id: string) => {
    try {
      await storageService.delete(id);
      await refreshModels();
    } catch (err) {
      //console.error('删除模型失败:', err);
      throw err;
    }
  };

  const toggleModel = async (id: string, isEnabled: boolean) => {
    try {
      await storageService.toggleEnabled(id, isEnabled);
      await refreshModels();
    } catch (err) {
      //console.error('切换模型状态失败:', err);
      throw err;
    }
  };

  const importConfigs = async (configs: ModelConfig[]) => {
    try {
      await storageService.importConfigs(configs);
      await refreshModels();
    } catch (err) {
      //console.error('导入配置失败:', err);
      throw err;
    }
  };

  const exportConfigs = async () => {
    try {
      return await storageService.exportConfigs();
    } catch (err) {
      //console.error('导出配置失败:', err);
      throw err;
    }
  };

  useEffect(() => {
    refreshModels();
  }, [refreshModels]);

  return (
    <ModelContext.Provider
      value={{
        models,
        isLoading,
        error,
        addModel,
        updateModel,
        deleteModel,
        toggleModel,
        importConfigs,
        exportConfigs,
        refreshModels
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
} 