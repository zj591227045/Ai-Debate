import React, { useState, useEffect } from 'react';
import { ModelInfo, AuthConfig } from '../../types/config';
import { ModelParameterForm } from '../common/ModelParameterForm';
import { AuthConfigForm } from '../common/AuthConfigForm';
import { ModelSelector } from '../common/ModelSelector';
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

  const handleAuthChange = (key: keyof AuthConfig, value: string) => {
    const auth = {
      baseUrl: key === 'baseUrl' ? value : formData.auth?.baseUrl || providerConfig.defaultBaseUrl || '',
      apiKey: key === 'apiKey' ? value : formData.auth?.apiKey || '',
      organizationId: key === 'organizationId' ? value : formData.auth?.organizationId || ''
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

  return (
    <div className="provider-form">
      <AuthConfigForm
        auth={{
          baseUrl: formData.auth?.baseUrl || providerConfig.defaultBaseUrl || '',
          apiKey: formData.auth?.apiKey || '',
          organizationId: formData.auth?.organizationId || ''
        }}
        requirements={{
          requiresApiKey: providerConfig.requiresApiKey,
          requiresBaseUrl: providerConfig.requiresBaseUrl,
          defaultBaseUrl: providerConfig.defaultBaseUrl
        }}
        onChange={handleAuthChange}
      />

      <div className="model-section">
        <h3>模型配置</h3>
        <ModelSelector
          value={formData.model || ''}
          models={availableModels}
          onSelect={handleModelChange}
          onTest={onTest}
          disabled={isLoading}
        />
      </div>

      <ModelParameterForm
        parameters={{
          temperature: formData.parameters?.temperature ?? providerConfig.parameterRanges.temperature?.default ?? 0.7,
          maxTokens: formData.parameters?.maxTokens ?? providerConfig.parameterRanges.maxTokens?.default ?? 2048,
          topP: formData.parameters?.topP ?? providerConfig.parameterRanges.topP?.default ?? 0.9
        }}
        ranges={providerConfig.parameterRanges}
        onChange={handleParameterChange}
      />
    </div>
  );
};

export class DeepseekProviderForm implements IProviderForm {
  Component = DeepseekFormComponent;
} 