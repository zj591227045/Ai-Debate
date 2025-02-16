import React, { useState, useEffect } from 'react';
import { ModelInfo } from '../../types/config';
import { ModelParameterForm } from '../common/ModelParameterForm';
import { AuthConfigForm } from '../common/AuthConfigForm';
import { IProviderForm, ProviderFormProps } from './ProviderFormFactory';

const DeepseekFormComponent: React.FC<ProviderFormProps> = ({
  formData,
  providerConfig,
  isLoading,
  onChange,
  onTest
}) => {
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>(providerConfig.models);
  const [modelError, setModelError] = useState<string | null>(null);

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
              disabled={isLoading}
              required
            >
              <option value="">请选择模型</option>
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

export class DeepseekProviderForm implements IProviderForm {
  private props: ProviderFormProps;

  constructor(props: ProviderFormProps) {
    this.props = props;
  }

  render(): React.ReactNode {
    return <DeepseekFormComponent {...this.props} />;
  }
} 