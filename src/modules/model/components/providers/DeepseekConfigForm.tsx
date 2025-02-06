import React from 'react';
import { PartialModelConfig, ModelParameters } from '../../types';
import { BalanceChecker } from '../common/BalanceChecker';
import '../common/styles.css';

interface DeepseekConfigFormProps {
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

export function DeepseekConfigForm({
  formData,
  onBaseUrlChange,
  onApiKeyChange,
  onModelChange,
  onParameterChange,
  availableModels,
  isLoadingModels,
  onRefreshModels,
  onTest,
}: DeepseekConfigFormProps) {
  return (
    <>
      <div className="form-group">
        <label htmlFor="baseUrl">服务地址</label>
        <input
          type="text"
          id="baseUrl"
          value={formData.auth?.baseUrl || ''}
          onChange={(e) => onBaseUrlChange(e.target.value)}
          placeholder="请输入服务地址"
        />
      </div>

      <div className="form-group">
        <label htmlFor="apiKey">API 密钥</label>
        <div className="api-key-group">
          <input
            type="password"
            id="apiKey"
            value={formData.auth?.apiKey || ''}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="请输入 API 密钥"
            required
          />
          <BalanceChecker
            provider="deepseek"
            apiKey={formData.auth?.apiKey || ''}
            baseUrl={formData.auth?.baseUrl}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="model">模型</label>
        <div className="model-select-group">
          <select
            id="model"
            value={formData.model || ''}
            onChange={(e) => onModelChange(e.target.value)}
            required
          >
            <option value="">请选择模型</option>
            {isLoadingModels ? (
              <option value="" disabled>加载中...</option>
            ) : (
              availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))
            )}
          </select>
          <button
            type="button"
            className="btn-secondary"
            onClick={onRefreshModels}
            disabled={isLoadingModels}
          >
            {isLoadingModels ? '刷新中...' : '刷新'}
          </button>
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
        />
      </div>

      <div className="form-group">
        <label htmlFor="maxTokens">最大 Token 数</label>
        <input
          type="number"
          id="maxTokens"
          min="1"
          value={formData.parameters?.maxTokens || 2000}
          onChange={onParameterChange('maxTokens')}
        />
      </div>
    </>
  );
} 