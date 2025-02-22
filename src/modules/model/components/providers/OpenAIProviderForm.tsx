import React, { useState, useEffect } from 'react';
import { ModelInfo, AuthConfig } from '../../types/config';
import { ModelParameterForm } from '../common/ModelParameterForm';
import { AuthConfigForm } from '../common/AuthConfigForm';
import { ModelSelector } from '../common/ModelSelector';
import { IProviderForm, ProviderFormProps } from './ProviderFormFactory';
import { message } from 'antd';

const OpenAIFormComponent: React.FC<ProviderFormProps> = ({
  formData,
  providerConfig,
  isLoading,
  onChange,
  onTest
}) => {
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>(providerConfig.models);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [customModel, setCustomModel] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    if (model !== customModel) {
      setCustomModel('');
    }
    onChange({ model });
  };

  const handleCustomModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomModel(value);
    
    if (value) {
      const customModelInfo: ModelInfo = {
        name: value,
        code: value,
        description: `自定义模型 ${value}`,
        contextWindow: 4096,
        maxTokens: 4096,
        features: ['对话', '代码生成', '文本补全']
      };
      
      const modelExists = availableModels.some(model => model.code === value);
      
      if (!modelExists) {
        setAvailableModels(prevModels => [...prevModels, customModelInfo]);
      }
    }
    
    onChange({ model: value });
  };

  const fetchModels = async () => {
    try {
      if (!formData.auth?.baseUrl || !formData.auth?.apiKey) {
        setError('请先配置服务地址和API密钥');
        return;
      }

      setIsLoadingModels(true);
      setError(null);

      const baseUrl = formData.auth.baseUrl.replace(/\/*$/, '');
      const apiUrl = `${baseUrl}/models`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${formData.auth.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error?.message || 
          `获取模型列表失败: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('返回数据格式错误');
      }

      const models: ModelInfo[] = data.data.map((model: any) => ({
        name: model.id,
        code: model.id,
        description: `OpenAI ${model.id} 模型`,
        contextWindow: 4096,
        maxTokens: 4096,
        features: ['对话', '代码生成', '文本补全']
      }));

      if (customModel) {
        const customModelExists = models.some(model => model.code === customModel);
        if (!customModelExists) {
          models.push({
            name: customModel,
            code: customModel,
            description: `自定义模型 ${customModel}`,
            contextWindow: 4096,
            maxTokens: 4096,
            features: ['对话', '代码生成', '文本补全']
          });
        }
      }

      setAvailableModels(models);
    } catch (error) {
      console.error('获取模型列表时出错:', error);
      const defaultModels = providerConfig.models;
      
      if (customModel) {
        const customModelExists = defaultModels.some(model => model.code === customModel);
        if (!customModelExists) {
          defaultModels.push({
            name: customModel,
            code: customModel,
            description: `自定义模型 ${customModel}`,
            contextWindow: 4096,
            maxTokens: 4096,
            features: ['对话', '代码生成', '文本补全']
          });
        }
      }
      
      setAvailableModels(defaultModels);
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setError('网络请求失败，请检查网络连接和API地址是否正确');
      } else {
        setError(error instanceof Error ? error.message : '获取模型列表失败');
      }
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

        <div className="custom-model-input">
          <label>
            自定义模型名称
            <input
              type="text"
              value={customModel}
              onChange={handleCustomModelChange}
              placeholder="如果模型列表中没有您需要的模型，可以在这里直接输入"
            />
          </label>
        </div>
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

export class OpenAIProviderForm implements IProviderForm {
  Component = OpenAIFormComponent;
} 