import React from 'react';
import { Select } from 'antd';
import { useModel } from '../../../model/context/ModelContext';
import type { CharacterConfig } from '../../types/character';
import type { ModelConfig } from '../../../model/types';
import './styles.css';
import { PROVIDERS } from '../../../llm/types/providers';

interface ModelSelectProps {
  data: CharacterConfig;
  onChange: (config: Partial<CharacterConfig>) => void;
}

export default function ModelSelect({ data, onChange }: ModelSelectProps) {
  const { models } = useModel();

  const handleModelChange = (modelId: string) => {
    const model = models.find((model: ModelConfig) => model.id === modelId);
    onChange({
      ...data,
      callConfig: {
        type: 'direct',
        direct: {
          provider: model?.provider || PROVIDERS.OLLAMA,
          modelId,
          model: model?.model || ''
        }
      }
    });
  };

  const getProviderName = (modelId: string) => {
    const model = models.find((model: ModelConfig) => model.id === modelId);
    return model?.provider || 'Unknown Provider';
  };

  return (
    <div className="model-select">
      <Select
        value={data.callConfig?.direct?.modelId}
        onChange={handleModelChange}
        placeholder="选择模型"
      >
        {models.map((model: ModelConfig) => (
          <Select.Option key={model.id} value={model.id}>
            {model.name} ({getProviderName(model.id)})
          </Select.Option>
        ))}
      </Select>
    </div>
  );
} 