import React from 'react';
import { Select, Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { useModel } from '../../../model/context/ModelContext';
import type { CharacterConfig } from '../../types/character';
import type { ModelConfig } from '../../../model/types';
import './styles.css';
import { PROVIDERS } from '../../../llm/types/providers';

interface CallModeConfigProps {
  data: CharacterConfig;
  onChange: (config: Partial<CharacterConfig>) => void;
}

export default function CallModeConfig({ data, onChange }: CallModeConfigProps) {
  const { models } = useModel();

  const handleCallTypeChange = (e: RadioChangeEvent) => {
    const type = e.target.value as "direct" | "dify";
    onChange({
      ...data,
      callConfig: {
        type,
        dify: type === 'dify' ? { serverUrl: '', apiKey: '' } : undefined,
        direct: type === 'direct' ? { 
          provider: PROVIDERS.OLLAMA,
          modelId: '',
          model: ''
        } : undefined
      }
    });
  };

  const handleDifyConfigChange = (field: string, value: string) => {
    onChange({
      ...data,
      callConfig: {
        ...data.callConfig,
        type: 'dify',
        dify: {
          serverUrl: field === 'serverUrl' ? value : (data.callConfig?.dify?.serverUrl || ''),
          apiKey: field === 'apiKey' ? value : (data.callConfig?.dify?.apiKey || '')
        }
      }
    });
  };

  const handleDirectConfigChange = (field: string, value: string) => {
    const model = models.find((m: ModelConfig) => m.id === value);
    onChange({
      ...data,
      callConfig: {
        ...data.callConfig,
        type: 'direct',
        direct: {
          provider: model?.provider || PROVIDERS.OLLAMA,
          modelId: value,
          model: model?.model || ''
        }
      }
    });
  };

  return (
    <div className="call-mode-config">
      <div className="form-item">
        <label>调用方式</label>
        <Radio.Group
          value={data.callConfig?.type || 'direct'}
          onChange={handleCallTypeChange}
        >
          <Radio value="direct">直接调用</Radio>
          <Radio value="dify">Dify API</Radio>
        </Radio.Group>
      </div>

      {data.callConfig?.type === 'dify' ? (
        <>
          <div className="form-item">
            <label>服务器地址</label>
            <input
              type="text"
              value={data.callConfig?.dify?.serverUrl || ''}
              onChange={(e) => handleDifyConfigChange('serverUrl', e.target.value)}
              placeholder="请输入Dify服务器地址"
            />
          </div>
          <div className="form-item">
            <label>API Key</label>
            <input
              type="password"
              value={data.callConfig?.dify?.apiKey || ''}
              onChange={(e) => handleDifyConfigChange('apiKey', e.target.value)}
              placeholder="请输入Dify API Key"
            />
          </div>
        </>
      ) : (
        <div className="form-item">
          <label>选择模型</label>
          <Select
            value={data.callConfig?.direct?.modelId || ''}
            onChange={(value) => handleDirectConfigChange('modelId', value)}
            placeholder="请选择模型"
            className="model-select"
          >
            {models.map((model: ModelConfig) => (
              <Select.Option key={model.id} value={model.id}>
                {model.name}
              </Select.Option>
            ))}
          </Select>
        </div>
      )}
    </div>
  );
} 