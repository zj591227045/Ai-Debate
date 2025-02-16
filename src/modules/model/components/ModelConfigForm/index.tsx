import React, { useState, useCallback } from 'react';
import { ModelConfig, ProviderConfig } from '../../types/config';
import { PROVIDER_CONFIGS } from '../../config/providers';
import { ProviderType } from '../../../llm/types/providers';
import { BaseProviderForm } from '../providers/BaseProviderForm';
import { ModelTestDialog } from '../ModelTestDialog';
import './styles.css';

interface ModelConfigFormProps {
  initialData?: Partial<ModelConfig>;
  onSubmit: (config: ModelConfig) => Promise<void>;
  onCancel: () => void;
  onTest?: (config: ModelConfig) => Promise<void>;
}

export const ModelConfigForm: React.FC<ModelConfigFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  onTest
}) => {
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(
    initialData?.provider as ProviderType || null
  );
  
  const [formData, setFormData] = useState<Partial<ModelConfig>>(
    initialData || {
      name: '',
      provider: '',
      model: '',
      parameters: {
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9
      },
      auth: {
        baseUrl: '',
        apiKey: ''
      }
    }
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);

  const handleProviderSelect = (provider: ProviderType) => {
    setSelectedProvider(provider);
    const providerConfig = PROVIDER_CONFIGS[provider];
    setFormData(prev => ({
      ...prev,
      provider,
      model: '',
      parameters: {
        temperature: providerConfig.parameterRanges.temperature?.default || 0.7,
        maxTokens: providerConfig.parameterRanges.maxTokens?.default || 2048,
        topP: providerConfig.parameterRanges.topP?.default || 0.9
      },
      auth: {
        baseUrl: providerConfig.defaultBaseUrl || '',
        apiKey: ''
      }
    }));
  };

  const handleChange = useCallback((data: Partial<ModelConfig>) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  const handleTest = async () => {
    if (!selectedProvider || !formData.model) {
      setError('请先完成模型配置');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // 验证必填字段
      const providerConfig = PROVIDER_CONFIGS[selectedProvider];
      
      if (providerConfig.requiresBaseUrl && !formData.auth?.baseUrl) {
        throw new Error('请输入服务地址');
      }
      if (providerConfig.requiresApiKey && !formData.auth?.apiKey) {
        throw new Error('请输入API密钥');
      }

      // 打开测试对话框
      setShowTestDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '测试失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) {
      setError('请选择供应商');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // 验证必填字段
      if (!formData.name?.trim()) {
        throw new Error('请输入配置名称');
      }
      if (!formData.model?.trim()) {
        throw new Error('请选择模型');
      }

      const providerConfig = PROVIDER_CONFIGS[selectedProvider];
      
      // 验证认证信息
      if (providerConfig.requiresBaseUrl && !formData.auth?.baseUrl) {
        throw new Error('请输入服务地址');
      }
      if (providerConfig.requiresApiKey && !formData.auth?.apiKey) {
        throw new Error('请输入API密钥');
      }

      await onSubmit(formData as ModelConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProviderSelector = () => (
    <div className="provider-grid">
      {Object.entries(PROVIDER_CONFIGS).map(([key, config]) => (
        <div
          key={key}
          className={`provider-card ${selectedProvider === key ? 'selected' : ''}`}
          onClick={() => handleProviderSelect(key as ProviderType)}
        >
          <div className="provider-icon">
            {config.name.charAt(0)}
          </div>
          <div className="provider-info">
            <h3 className="provider-name">{config.name}</h3>
            <p className="provider-description">{config.description}</p>
          </div>
          {selectedProvider === key && (
            <div className="provider-selected">✓</div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <form className="model-config-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <h2>{initialData ? '编辑模型配置' : '新建模型配置'}</h2>
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="form-section">
          <label>配置名称</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={e => handleChange({ name: e.target.value })}
            placeholder="请输入配置名称"
            required
          />
        </div>

        <div className="form-section">
          <label>供应商</label>
          {renderProviderSelector()}
        </div>

        {selectedProvider && (
          <BaseProviderForm
            formData={formData}
            providerConfig={PROVIDER_CONFIGS[selectedProvider]}
            isLoading={isLoading}
            onChange={handleChange}
            onTest={handleTest}
          />
        )}
      </form>

      {showTestDialog && (
        <ModelTestDialog
          modelConfig={formData as ModelConfig}
          onClose={() => setShowTestDialog(false)}
        />
      )}
    </>
  );
}; 