import React from 'react';
import { PartialModelConfig, ModelParameters } from '../../types';
import { BalanceChecker } from '../common/BalanceChecker';
import '../common/styles.css';

interface SiliconFlowConfigFormProps {
  formData: PartialModelConfig;
  onBaseUrlChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onParameterChange: (parameter: keyof ModelParameters) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  availableModels: string[];
  isLoadingModels?: boolean;
  onRefreshModels?: () => void;
  onTest?: () => void;
}

export function SiliconFlowConfigForm({
  formData,
  onBaseUrlChange,
  onApiKeyChange,
  onModelChange,
  onParameterChange,
  availableModels,
  isLoadingModels,
  onRefreshModels,
  onTest,
}: SiliconFlowConfigFormProps) {
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onApiKeyChange(value);
  };

  return (
    <>
      <div className="form-group">
        <label htmlFor="baseUrl">服务地址 *</label>
        <input
          type="text"
          id="baseUrl"
          value={formData.auth?.baseUrl || ''}
          onChange={(e) => onBaseUrlChange(e.target.value)}
          placeholder="请输入服务地址，例如：https://api.siliconflow.cn"
          className="api-key-input"
          required
        />
        <small className="form-text text-muted">
          硅基流动API服务地址，必填项
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="apiKey">API 密钥 *</label>
        <div className="api-key-input-group">
          <input
            type="password"
            id="apiKey"
            value={formData.auth?.apiKey || ''}
            onChange={handleApiKeyChange}
            placeholder="请输入硅基流动的 API 密钥"
            required
            className="api-key-input"
          />
          <small className="form-text text-muted">
            在硅基流动控制台获取的API密钥，必填项
          </small>
          {formData.auth?.apiKey && (
            <BalanceChecker
              provider="siliconflow"
              apiKey={formData.auth.apiKey}
              baseUrl={formData.auth?.baseUrl}
            />
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="model">模型 *</label>
        <div className="model-select-group">
          <select
            id="model"
            value={formData.model || ''}
            onChange={(e) => onModelChange(e.target.value)}
            required
            className="model-select"
            disabled={isLoadingModels}
          >
            <option value="">请选择模型</option>
            {isLoadingModels ? (
              <option value="" disabled>加载中...</option>
            ) : (
              availableModels.map((model) => (
                <option key={model} value={model}>
                  {model} {model.startsWith('Pro/') && '(付费)'}
                </option>
              ))
            )}
          </select>
          {formData.model?.startsWith('Pro/') && (
            <small className="form-text text-warning">
              注意：此为付费模型，请确保账户余额充足
            </small>
          )}
          {onRefreshModels && (
            <button
              type="button"
              onClick={onRefreshModels}
              disabled={isLoadingModels}
              className="refresh-button"
            >
              {isLoadingModels ? '加载中...' : '刷新'}
            </button>
          )}
          {onTest && (
            <button
              type="button"
              className="btn-primary"
              onClick={onTest}
              disabled={!formData.model || isLoadingModels || !formData.auth?.apiKey}
            >
              测试对话
            </button>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="temperature">温度 (0-2)</label>
        <input
          type="number"
          id="temperature"
          min="0"
          max="2"
          step="0.1"
          value={formData.parameters?.temperature || 0.7}
          onChange={onParameterChange('temperature')}
          className="parameter-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="topP">Top P (0-1)</label>
        <input
          type="number"
          id="topP"
          min="0"
          max="1"
          step="0.1"
          value={formData.parameters?.topP || 0.9}
          onChange={onParameterChange('topP')}
          className="parameter-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="maxTokens">最大 Token 数</label>
        <input
          type="number"
          id="maxTokens"
          min="1"
          max="4096"
          value={formData.parameters?.maxTokens || 2000}
          onChange={onParameterChange('maxTokens')}
          className="parameter-input"
        />
      </div>
    </>
  );
} 