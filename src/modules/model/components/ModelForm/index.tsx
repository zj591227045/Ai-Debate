import React, { useState } from 'react';
import { ModelConfig, PartialModelConfig, DEFAULT_PARAMETER_RANGES } from '../../types';
import { useModel } from '../../context/ModelContext';
import { testModelConfig } from '../../utils/modelValidation';
import ModelTestDialog from '../ModelTestDialog';
import { v4 as uuidv4 } from 'uuid';
import './styles.css';

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
  };
};

export default function ModelForm({ model, onSubmit, onCancel }: ModelFormProps) {
  const { state, dispatch } = useModel();
  const [formData, setFormData] = useState<PartialModelConfig>(createInitialState(model));
  const [isTesting, setIsTesting] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);

  const handleInputChange = (field: keyof ModelConfig, value: any) => {
    setFormData((prev: PartialModelConfig) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAuthChange = (field: keyof ModelConfig['auth'], value: string) => {
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

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = state.providers.find(p => p.id === e.target.value);
    setFormData((prev: PartialModelConfig) => ({
      ...prev,
      provider: e.target.value,
      model: '',
      auth: {
        ...prev.auth,
        baseUrl: provider?.defaultBaseUrl || '',
      },
    }));
  };

  const handleTestConnection = async () => {
    if (!formData.provider || !formData.model) {
      alert('请先选择供应商和模型');
      return;
    }

    if (!formData.auth?.apiKey) {
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
        apiKey: formData.auth.apiKey,
        organizationId: formData.auth.organizationId || '',
        baseUrl: formData.auth.baseUrl || '',
      },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.provider || !formData.model || !formData.auth?.apiKey) {
      alert('请填写所有必填字段');
      return;
    }

    const completeModel: ModelConfig = {
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
        apiKey: formData.auth.apiKey,
        organizationId: formData.auth.organizationId || '',
        baseUrl: formData.auth.baseUrl || '',
      },
    };

    if (model) {
      dispatch({ type: 'UPDATE_MODEL', payload: completeModel });
    } else {
      dispatch({ type: 'ADD_MODEL', payload: completeModel });
    }
    onSubmit?.();
  };

  const selectedProvider = state.providers.find(p => p.id === formData.provider);

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
            {state.providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>

        {formData.provider && (
          <div className="form-group">
            <label htmlFor="model">模型</label>
            <div className="model-select-group">
              <select
                id="model"
                value={formData.model || ''}
                onChange={(e) => handleInputChange('model', e.target.value)}
                required
              >
                <option value="">请选择模型</option>
                {selectedProvider?.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleTestConnection}
                disabled={isTesting || !formData.provider || !formData.model || !formData.auth?.apiKey}
              >
                {isTesting ? '测试中...' : '测试连接'}
              </button>
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="apiKey">API密钥</label>
          <input
            type="password"
            id="apiKey"
            value={formData.auth?.apiKey || ''}
            onChange={(e) => handleAuthChange('apiKey', e.target.value)}
            placeholder="请输入API密钥"
            required
          />
        </div>

        {selectedProvider?.requiresOrganization && (
          <div className="form-group">
            <label htmlFor="organizationId">组织ID</label>
            <input
              type="text"
              id="organizationId"
              value={formData.auth?.organizationId || ''}
              onChange={(e) => handleAuthChange('organizationId', e.target.value)}
              placeholder="请输入组织ID（可选）"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="baseUrl">服务地址</label>
          <input
            type="text"
            id="baseUrl"
            value={formData.auth?.baseUrl || ''}
            onChange={(e) => handleAuthChange('baseUrl', e.target.value)}
            placeholder={`请输入服务地址（默认：${selectedProvider?.defaultBaseUrl || ''}）`}
          />
        </div>

        <div className="form-group">
          <label htmlFor="temperature">Temperature</label>
          <div className="parameter-input">
            <input
              type="range"
              id="temperature"
              min={DEFAULT_PARAMETER_RANGES.temperature.min}
              max={DEFAULT_PARAMETER_RANGES.temperature.max}
              step={DEFAULT_PARAMETER_RANGES.temperature.step}
              value={formData.parameters?.temperature ?? defaultParameters.temperature}
              onChange={handleParameterChange('temperature')}
            />
            <span className="parameter-value">
              {formData.parameters?.temperature ?? defaultParameters.temperature}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="topP">Top P</label>
          <div className="parameter-input">
            <input
              type="range"
              id="topP"
              min={DEFAULT_PARAMETER_RANGES.topP.min}
              max={DEFAULT_PARAMETER_RANGES.topP.max}
              step={DEFAULT_PARAMETER_RANGES.topP.step}
              value={formData.parameters?.topP ?? defaultParameters.topP}
              onChange={handleParameterChange('topP')}
            />
            <span className="parameter-value">
              {formData.parameters?.topP ?? defaultParameters.topP}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="maxTokens">最大Token数</label>
          <div className="parameter-input">
            <input
              type="range"
              id="maxTokens"
              min={DEFAULT_PARAMETER_RANGES.maxTokens.min}
              max={DEFAULT_PARAMETER_RANGES.maxTokens.max}
              step={DEFAULT_PARAMETER_RANGES.maxTokens.step}
              value={formData.parameters?.maxTokens ?? defaultParameters.maxTokens}
              onChange={handleParameterChange('maxTokens')}
            />
            <span className="parameter-value">
              {formData.parameters?.maxTokens ?? defaultParameters.maxTokens}
            </span>
          </div>
        </div>

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
          <ModelTestDialog
            model={formData as ModelConfig}
            onClose={() => setShowTestDialog(false)}
          />
        </>
      )}
    </>
  );
} 