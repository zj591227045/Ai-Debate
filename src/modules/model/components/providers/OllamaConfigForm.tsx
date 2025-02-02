import React from 'react';
import { PartialModelConfig, ModelParameters } from '../../types';

interface OllamaConfigFormProps {
  formData: PartialModelConfig;
  onBaseUrlChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onParameterChange: (parameter: keyof ModelParameters) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  availableModels: string[];
  isLoadingModels: boolean;
  onRefreshModels: () => void;
  onTest?: () => void;
}

export function OllamaConfigForm({
  formData,
  onBaseUrlChange,
  onModelChange,
  onParameterChange,
  availableModels,
  isLoadingModels,
  onRefreshModels,
  onTest,
}: OllamaConfigFormProps) {
  return (
    <>
      <div className="form-group">
        <label htmlFor="baseUrl">服务地址</label>
        <input
          type="text"
          id="baseUrl"
          value={formData.auth?.baseUrl || ''}
          onChange={(e) => onBaseUrlChange(e.target.value)}
          placeholder="请输入服务地址（默认：http://localhost:11434）"
        />
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
              disabled={!formData.model || isLoadingModels}
            >
              测试对话
            </button>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="temperature">Temperature</label>
        <div className="parameter-input">
          <input
            type="range"
            id="temperature"
            min={0}
            max={2}
            step={0.1}
            value={formData.parameters?.temperature ?? 0.7}
            onChange={onParameterChange('temperature')}
          />
          <span className="parameter-value">
            {formData.parameters?.temperature ?? 0.7}
          </span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="topP">Top P</label>
        <div className="parameter-input">
          <input
            type="range"
            id="topP"
            min={0}
            max={1}
            step={0.1}
            value={formData.parameters?.topP ?? 0.9}
            onChange={onParameterChange('topP')}
          />
          <span className="parameter-value">
            {formData.parameters?.topP ?? 0.9}
          </span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="maxTokens">最大Token数</label>
        <div className="parameter-input">
          <input
            type="range"
            id="maxTokens"
            min={100}
            max={4000}
            step={100}
            value={formData.parameters?.maxTokens ?? 2000}
            onChange={onParameterChange('maxTokens')}
          />
          <span className="parameter-value">
            {formData.parameters?.maxTokens ?? 2000}
          </span>
        </div>
      </div>
    </>
  );
} 