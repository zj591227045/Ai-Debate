import React, { useState, useEffect } from 'react';
import { ModelInfo, AuthConfig } from '../../types/config';
import { ModelParameterForm } from '../common/ModelParameterForm';
import { AuthConfigForm } from '../common/AuthConfigForm';
import { ModelSelector } from '../common/ModelSelector';
import { IProviderForm, ProviderFormProps } from './ProviderFormFactory';
import { message } from 'antd';

const SiliconFlowFormComponent: React.FC<ProviderFormProps> = ({
  formData,
  providerConfig,
  isLoading,
  onChange,
  onTest
}) => {
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>(providerConfig.models);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
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

  const fetchModels = async () => {
    if (!formData.auth?.baseUrl || !formData.auth?.apiKey) {
      message.warning('请先配置服务地址和API密钥');
      return;
    }

    setIsLoadingModels(true);
    setModelError(null);

    try {
      const response = await fetch(`${formData.auth.baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${formData.auth.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`获取模型列表失败: ${response.statusText}`);
      }

      const data = await response.json();
      const models: ModelInfo[] = data.data.map((model: any) => ({
        name: model.id,
        code: model.id,
        description: `SiliconFlow ${model.id} 模型`,
        contextWindow: 4096,
        maxTokens: 4096,
        features: ['对话', '代码生成', '文本补全']
      }));

      setAvailableModels(models);
    } catch (error) {
      setModelError(error instanceof Error ? error.message : '获取模型列表失败');
      message.error('获取模型列表失败');
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    if (formData.auth?.baseUrl && formData.auth?.apiKey) {
      fetchModels();
    }
  }, [formData.auth?.baseUrl, formData.auth?.apiKey]);

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
          isLoading={isLoadingModels}
          onSelect={handleModelChange}
          onRefresh={fetchModels}
          onTest={onTest}
          disabled={isLoading}
        />

        {modelError && (
          <div className="error-message">
            {modelError}
          </div>
        )}
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

export class SiliconFlowProviderForm implements IProviderForm {
  Component = SiliconFlowFormComponent;
} 