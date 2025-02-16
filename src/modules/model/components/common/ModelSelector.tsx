import React from 'react';
import { ModelInfo } from '../../types/config';
import './styles.css';

interface ModelSelectorProps {
  value: string;
  models: ModelInfo[];
  isLoading?: boolean;
  onSelect: (modelId: string) => void;
  onRefresh?: () => void;
  onTest?: () => void;
  disabled?: boolean;
}

const ActionButtons: React.FC<{
  onRefresh?: () => void;
  onTest?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}> = ({ onRefresh, onTest, isLoading, disabled }) => (
  <div className="action-buttons">
    {onRefresh && (
      <button
        type="button"
        className="btn-secondary"
        onClick={onRefresh}
        disabled={isLoading || disabled}
      >
        {isLoading ? '刷新中...' : '刷新'}
      </button>
    )}
    {onTest && (
      <button
        type="button"
        className="btn-primary"
        onClick={onTest}
        disabled={disabled || isLoading}
      >
        测试对话
      </button>
    )}
  </div>
);

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  models,
  isLoading,
  onSelect,
  onRefresh,
  onTest,
  disabled
}) => {
  return (
    <div className="model-select-group">
      <div className="select-container">
        <label>模型</label>
        <select
          value={value}
          onChange={e => onSelect(e.target.value)}
          disabled={disabled || isLoading}
          required
        >
          <option value="">请选择模型</option>
          {isLoading ? (
            <option value="" disabled>加载中...</option>
          ) : (
            models.map(model => (
              <option key={model.code} value={model.code}>
                {model.name}
              </option>
            ))
          )}
        </select>
      </div>
      <ActionButtons
        onRefresh={onRefresh}
        onTest={onTest}
        isLoading={isLoading}
        disabled={disabled || !value}
      />
    </div>
  );
}; 