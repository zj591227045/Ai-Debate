import React from 'react';
import { CharacterConfig } from '../../types';
import { useModel } from '../../../model/context/ModelContext';

interface ModelSelectProps {
  data: Partial<CharacterConfig>;
  onChange: (data: Partial<CharacterConfig>) => void;
}

export default function ModelSelect({ data, onChange }: ModelSelectProps) {
  const { state } = useModel();

  const handleModelChange = (modelId: string) => {
    onChange({
      ...data,
      modelId,
    });
  };

  return (
    <div className="model-select">
      <div className="form-group">
        <label>选择模型配置</label>
        <div className="model-list">
          {state.models.map((model) => {
            const provider = state.providers.find(p => p.id === model.provider);
            return (
              <div
                key={model.id}
                className={`model-card ${data.modelId === model.id ? 'active' : ''}`}
                onClick={() => handleModelChange(model.id)}
              >
                <div className="model-card-header">
                  <h3>{model.name}</h3>
                  <span className="provider-tag">{provider?.name}</span>
                </div>
                <div className="model-info">
                  <div className="model-detail">
                    <span className="label">模型:</span>
                    <span className="value">{model.model}</span>
                  </div>
                  <div className="model-detail">
                    <span className="label">Temperature:</span>
                    <span className="value">{model.parameters.temperature}</span>
                  </div>
                  <div className="model-detail">
                    <span className="label">Top P:</span>
                    <span className="value">{model.parameters.topP}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {state.models.length === 0 && (
            <div className="empty-state">
              <p>暂无可用的模型配置，请先在模型管理中添加配置</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 