import React, { useState, useEffect } from 'react';
import { ModelConfig, PartialModelConfig, DEFAULT_PARAMETER_RANGES, AuthConfig, ModelProvider } from '../../types';
import { useModel } from '../../context/ModelContext';
import { testModelConfig } from '../../utils/modelValidation';
import ModelTestDialog from '../ModelTestDialog';
import { OllamaTestDialog } from '../providers/OllamaTestDialog';
import { v4 as uuidv4 } from 'uuid';
import './styles.css';
import { ModelProvider as NewModelProvider } from '../../../ai-model/types/providers';
import { AIModelProviderFactory } from '../../../ai-model/services/provider-factory';
import { OllamaConfigForm } from '../providers/OllamaConfigForm';
import { OllamaConfigFactory } from '../../factories/OllamaConfigFactory';
import { DeepseekConfigForm } from '../providers/DeepseekConfigForm';
import { DeepseekConfigFactory } from '../../factories/DeepseekConfigFactory';
import { ModelConfigService } from '../../../storage/services/ModelConfigService';

interface ModelFormProps {
  model?: ModelConfig;
  onSubmit?: () => void;
  onCancel?: () => void;
}

const defaultParameters = {
  temperature: DEFAULT_PARAMETER_RANGES.temperature.default,
  topP: DEFAULT_PARAMETER_RANGES.topP.default,
  maxTokens: DEFAULT_PARAMETER_RANGES.maxTokens.default,
};

const createInitialState = (model?: ModelConfig): PartialModelConfig => {
  if (model) {
    return { ...model };
  }
  return {
    id: uuidv4(),
    name: '',
    provider: '',
    model: '',
    parameters: defaultParameters,
    auth: {
      apiKey: '',
      organizationId: '',
      baseUrl: '',
    },
    isEnabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

export default function ModelForm({ model, onSubmit, onCancel }: ModelFormProps) {
  const { dispatch } = useModel();
  const [formData, setFormData] = useState<PartialModelConfig>(createInitialState(model));
  const [isTesting, setIsTesting] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const providerFactory = new AIModelProviderFactory();
  const modelService = new ModelConfigService();

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value;
    setFormData(prev => ({
      ...prev,
      provider,
      model: '',
      auth: {
        apiKey: '',
        organizationId: '',
        baseUrl: provider === 'ollama' ? 'http://localhost:11434' : '',
      },
    }));
    // 当切换提供商时，重置模型列表并触发刷新
    setAvailableModels([]);
    if (provider) {
      refreshModelList();
    }
  };

  const refreshModelList = async () => {
    setIsLoadingModels(true);
    try {
      let modelList: string[] = [];
      if (formData.provider === 'ollama') {
        const response = await fetch(`${formData.auth?.baseUrl || 'http://localhost:11434'}/api/tags`);
        if (!response.ok) {
          throw new Error(`获取模型列表失败: ${response.statusText}`);
        }
        const data = await response.json();
        modelList = data.models.map((model: any) => model.name);
      } else if (formData.provider === 'deepseek') {
        const response = await fetch(`${formData.auth?.baseUrl || 'http://localhost:11434'}/models`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${formData.auth?.apiKey || ''}`
          }
        });
        if (!response.ok) {
          throw new Error(`获取模型列表失败: ${response.statusText}`);
        }
        const data = await response.json();
        modelList = data.data.map((model: any) => model.id);
      } else {
        modelList = ['model1', 'model2']; // 默认模型列表
      }
      setAvailableModels(modelList);
    } catch (error) {
      console.error('获取模型列表失败:', error);
      setAvailableModels(['model1', 'model2']); // 默认模型列表
    } finally {
      setIsLoadingModels(false);
    }
  };

  // 当 API 密钥改变时，自动刷新模型列表
  useEffect(() => {
    if (formData.provider === 'deepseek' && formData.auth?.apiKey) {
      refreshModelList();
    }
  }, [formData.provider, formData.auth?.apiKey]);

  const handleInputChange = (field: keyof ModelConfig, value: any) => {
    setFormData((prev: PartialModelConfig) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAuthChange = (field: keyof AuthConfig, value: string) => {
    setFormData((prev: PartialModelConfig) => ({
      ...prev,
      auth: {
        ...prev.auth,
        [field]: value,
      },
    }));
  };

  const handleParameterChange = (parameter: keyof typeof DEFAULT_PARAMETER_RANGES) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(e.target.value);
    setFormData((prev: PartialModelConfig) => ({
      ...prev,
      parameters: {
        ...(prev.parameters || defaultParameters),
        [parameter]: value,
      },
    }));
  };

  const getAvailableModels = () => {
    if (formData.provider === 'ollama') {
      return availableModels;
    }
    return ['model1', 'model2']; // Assuming default models
  };

  const handleTestConnection = async () => {
    if (!formData.provider || !formData.model) {
      alert('请先选择供应商和模型');
      return;
    }

    if (formData.provider !== 'ollama' && !formData.auth?.apiKey) {
      alert('请输入API密钥');
      return;
    }

    const completeModel: ModelConfig = {
      id: formData.id || uuidv4(),
      name: formData.name || '未命名配置',
      provider: formData.provider,
      model: formData.model,
      parameters: {
        temperature: formData.parameters?.temperature ?? defaultParameters.temperature,
        topP: formData.parameters?.topP ?? defaultParameters.topP,
        maxTokens: formData.parameters?.maxTokens ?? defaultParameters.maxTokens,
      },
      auth: {
        apiKey: formData.auth?.apiKey || '',
        organizationId: formData.auth?.organizationId || '',
        baseUrl: formData.auth?.baseUrl || '',
      },
      isEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setIsTesting(true);
    try {
      const result = await testModelConfig(completeModel);
      if (result.isValid) {
        setShowTestDialog(true);
      } else {
        alert(`连接测试失败：\n${result.errors.join('\n')}`);
      }
    } catch (error) {
      alert(`测试出错：${(error as Error).message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const renderProviderSpecificConfig = () => {
    switch (formData.provider) {
      case 'ollama':
        return (
          <OllamaConfigForm
            formData={formData}
            onBaseUrlChange={(value) => handleAuthChange('baseUrl', value)}
            onModelChange={(value) => handleInputChange('model', value)}
            onParameterChange={handleParameterChange}
            availableModels={availableModels}
            isLoadingModels={isLoadingModels}
            onRefreshModels={refreshModelList}
            onTest={handleTestConnection}
          />
        );
      case 'deepseek':
        return (
          <DeepseekConfigForm
            formData={formData}
            onBaseUrlChange={(value) => handleAuthChange('baseUrl', value)}
            onApiKeyChange={(value) => handleAuthChange('apiKey', value)}
            onModelChange={(value) => handleInputChange('model', value)}
            onParameterChange={handleParameterChange}
            availableModels={availableModels}
            isLoadingModels={isLoadingModels}
            onRefreshModels={refreshModelList}
            onTest={handleTestConnection}
          />
        );
      // 其他供应商的配置组件...
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.provider || !formData.model) {
      alert('请填写所有必填字段');
      return;
    }

    if (formData.provider !== 'ollama' && !formData.auth?.apiKey) {
      alert('请填写API密钥');
      return;
    }

    try {
      let completeModel: ModelConfig;
      switch (formData.provider) {
        case 'ollama':
          completeModel = OllamaConfigFactory.createConfig(formData);
          break;
        case 'deepseek':
          completeModel = DeepseekConfigFactory.createConfig(formData);
          break;
        default:
          completeModel = {
            id: formData.id || uuidv4(),
            name: formData.name,
            provider: formData.provider,
            model: formData.model,
            parameters: {
              temperature: formData.parameters?.temperature ?? defaultParameters.temperature,
              topP: formData.parameters?.topP ?? defaultParameters.topP,
              maxTokens: formData.parameters?.maxTokens ?? defaultParameters.maxTokens,
            },
            auth: {
              apiKey: formData.auth?.apiKey || '',
              organizationId: formData.auth?.organizationId || '',
              baseUrl: formData.auth?.baseUrl || '',
            },
            isEnabled: true,
            createdAt: model ? model.createdAt : Date.now(),
            updatedAt: Date.now(),
          };
      }

      try {
        if (model) {
          // 更新现有配置
          await modelService.update(completeModel.id, {
            ...completeModel,
            createdAt: model.createdAt, // 保持原有的创建时间
          });
          dispatch({ type: 'UPDATE_MODEL', payload: completeModel });
        } else {
          // 创建新配置
          const now = Date.now();
          const newModel = {
            ...completeModel,
            createdAt: now,
            updatedAt: now,
          };
          await modelService.create(newModel);
          dispatch({ type: 'ADD_MODEL', payload: newModel });
        }
        onSubmit?.();
      } catch (error) {
        console.error('保存失败:', error);
        if ((error as Error).message === 'Item not found') {
          // 如果是更新时找不到记录，尝试创建新记录
          const now = Date.now();
          const newModel = {
            ...completeModel,
            createdAt: now,
            updatedAt: now,
          };
          await modelService.create(newModel);
          dispatch({ type: 'ADD_MODEL', payload: newModel });
          onSubmit?.();
        } else {
          throw error;
        }
      }
    } catch (error) {
      alert(`保存失败: ${(error as Error).message}`);
    }
  };

  return (
    <>
      <form className="model-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">配置名称</label>
          <input
            type="text"
            id="name"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="请输入配置名称"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="provider">模型供应商</label>
          <select
            id="provider"
            value={formData.provider || ''}
            onChange={handleProviderChange}
            required
          >
            <option value="">请选择供应商</option>
            <option value="ollama">Ollama</option>
            <option value="deepseek">DeepSeek</option>
          </select>
        </div>

        {formData.provider && renderProviderSpecificConfig()}

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            保存
          </button>
          {onCancel && (
            <button type="button" className="btn-secondary" onClick={onCancel}>
              取消
            </button>
          )}
        </div>
      </form>

      {showTestDialog && (
        <>
          <div className="dialog-overlay" onClick={() => setShowTestDialog(false)} />
          {formData.provider === 'ollama' ? (
            <OllamaTestDialog
              model={formData as ModelConfig}
              onClose={() => setShowTestDialog(false)}
            />
          ) : (
            <ModelTestDialog
              model={formData as ModelConfig}
              onClose={() => setShowTestDialog(false)}
            />
          )}
        </>
      )}
    </>
  );
} 