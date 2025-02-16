import React, { useState, useEffect } from 'react';
import { ModelInfo } from '../../types/config';
import { ModelParameterForm } from '../common/ModelParameterForm';
import { AuthConfigForm } from '../common/AuthConfigForm';
import { IProviderForm, ProviderFormProps } from './ProviderFormFactory';

interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

const OllamaFormComponent: React.FC<ProviderFormProps> = ({
  formData,
  providerConfig,
  isLoading,
  onChange,
  onTest
}) => {
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>(providerConfig.models);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const fetchModels = async (baseUrl: string) => {
    try {
      setIsLoadingModels(true);
      setModelError(null);
      
      const response = await fetch(`${baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error('获取模型列表失败');
      }
      
      const data = await response.json();
      const models: OllamaModel[] = data.models || [];
      
      setAvailableModels(models.map(model => ({
        name: model.name,
        code: model.name,
        description: `大小: ${(model.size / 1024 / 1024 / 1024).toFixed(2)}GB, 更新时间: ${new Date(model.modified_at).toLocaleString()}`,
        contextWindow: 4096,
        maxTokens: 4096,
        features: ['对话', '代码生成']
      })));
    } catch (err) {
      console.error('获取Ollama模型列表失败:', err);
      setModelError(err instanceof Error ? err.message : '获取模型列表失败');
      setAvailableModels(providerConfig.models);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleAuthChange = (key: string, value: string) => {
    const auth = {
      baseUrl: (key === 'baseUrl' ? value : formData.auth?.baseUrl) || providerConfig.defaultBaseUrl || '',
      apiKey: (key === 'apiKey' ? value : formData.auth?.apiKey) || '',
      organizationId: (key === 'organizationId' ? value : formData.auth?.organizationId) || ''
    };
    onChange({ auth });
  };

  const handleParameterChange = (key: string, value: number) => {
    const parameters = {
      temperature: key === 'temperature' ? value : (formData.parameters?.temperature ?? providerConfig.parameterRanges.temperature?.default ?? 0.7),
      maxTokens: key === 'maxTokens' ? value : (formData.parameters?.maxTokens ?? providerConfig.parameterRanges.maxTokens?.default ?? 2048),
      topP: key === 'topP' ? value : (formData.parameters?.topP ?? providerConfig.parameterRanges.topP?.default ?? 0.9)
    };
    onChange({ parameters });
  };

  const handleModelChange = (model: string) => {
    onChange({ model });
  };

  const defaultAuth = {
    baseUrl: providerConfig.defaultBaseUrl || '',
    apiKey: '',
    organizationId: ''
  };

  const defaultParameters = {
    temperature: providerConfig.parameterRanges.temperature?.default || 0.7,
    maxTokens: providerConfig.parameterRanges.maxTokens?.default || 2048,
    topP: providerConfig.parameterRanges.topP?.default || 0.9
  };

  // 当 baseUrl 变化时更新模型列表
  useEffect(() => {
    if (formData.auth?.baseUrl) {
      fetchModels(formData.auth.baseUrl);
    }
  }, [formData.auth?.baseUrl]);

  return (
    <>
      {/* Auth Section */}
      {(providerConfig.requiresBaseUrl || providerConfig.requiresApiKey) && (
        <div className="auth-section">
          <AuthConfigForm
            auth={formData.auth || defaultAuth}
            requirements={{
              requiresApiKey: providerConfig.requiresApiKey,
              requiresBaseUrl: providerConfig.requiresBaseUrl,
              defaultBaseUrl: providerConfig.defaultBaseUrl
            }}
            onChange={handleAuthChange}
          />
        </div>
      )}

      {/* Model Selection Section */}
      <div className="model-section">
        <div className="model-select-container">
          <label>模型</label>
          <div className="model-select-group">
            <select
              value={formData.model || ''}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={isLoading || isLoadingModels}
              required
            >
              <option value="">
                {isLoadingModels ? '加载模型列表中...' : '请选择模型'}
              </option>
              {availableModels.map((model) => (
                <option key={model.code} value={model.code}>
                  {model.name} {model.description ? `- ${model.description}` : ''}
                </option>
              ))}
            </select>
            {onTest && (
              <button
                type="button"
                className="test-button"
                onClick={onTest}
                disabled={isLoading || !formData.model}
              >
                {isLoading ? '测试中...' : '测试对话'}
              </button>
            )}
          </div>
          {modelError && (
            <div className="error-message">
              {modelError}
            </div>
          )}
        </div>
      </div>

      {/* Parameters Section */}
      <div className="parameters-section">
        <ModelParameterForm
          parameters={formData.parameters || defaultParameters}
          ranges={providerConfig.parameterRanges}
          onChange={handleParameterChange}
        />
      </div>
    </>
  );
};

export class OllamaProviderForm implements IProviderForm {
  private props: ProviderFormProps;

  constructor(props: ProviderFormProps) {
    this.props = props;
  }

  render(): React.ReactNode {
    return <OllamaFormComponent {...this.props} />;
  }
} 