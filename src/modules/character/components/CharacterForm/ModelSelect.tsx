import React from 'react';
import { CharacterConfig } from '../../types';
import { useModel } from '../../../model/context/ModelContext';
import './styles.css';

interface ModelSelectProps {
  data: Partial<CharacterConfig>;
  onChange: (data: Partial<CharacterConfig>) => void;
}

export default function ModelSelect({ data, onChange }: ModelSelectProps) {
  const { state } = useModel();
  const { models } = state;

  const handleModelChange = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    const newConfig: Partial<CharacterConfig> = {
      ...data,
      callConfig: {
        type: 'direct',
        direct: {
          provider: model?.provider || 'ollama',
          modelId,
          model: model?.name || modelId
        }
      }
    };
    onChange(newConfig);
  };

  const getProviderName = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    return model?.provider || 'Unknown Provider';
  };

  return (
    <div className="model-select">
      <div className="model-list">
        {models.map((model: { id: string; name: string }) => {
          const providerName = getProviderName(model.id);
          const isSelected = data.callConfig?.type === 'direct' && 
                           data.callConfig.direct?.modelId === model.id;

          return (
            <div
              key={model.id}
              className={`model-item ${isSelected ? 'selected' : ''}`}
              onClick={() => handleModelChange(model.id)}
            >
              <div className="model-info">
                <div className="model-name">{model.name}</div>
                <div className="model-provider">{providerName}</div>
              </div>
              {isSelected && (
                <div className="selected-indicator">✓</div>
              )}
            </div>
          );
        })}

        {models.length === 0 && (
          <div className="empty-state">
            <p>暂无可用的模型配置，请先在模型管理中添加配置</p>
          </div>
        )}
      </div>
    </div>
  );
} 