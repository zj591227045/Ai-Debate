import React from 'react';
import { Select, message } from 'antd';
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
    console.log('选择模型:', modelId);
    console.log('可用模型列表:', models);
    
    const model = models.find((model: ModelConfig) => model.id === modelId);
    if (!model) {
      console.error('未找到选择的模型配置:', modelId);
      message.error('模型配置加载失败');
      return;
    }

    console.log('找到模型配置:', model);
    onChange({
      ...data,
      callConfig: {
        type: 'direct',
        direct: {
          provider: model.provider,
          modelId: model.id,
          model: model.model
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