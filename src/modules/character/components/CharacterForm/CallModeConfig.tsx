import React from 'react';
import { Form, Radio, Input, Select, Space } from 'antd';
import { CharacterConfig } from '../../types';
import { useModel } from '../../../model/context/ModelContext';
import './styles.css';

interface CallModeConfigProps {
  data: Partial<CharacterConfig>;
  onChange: (data: Partial<CharacterConfig>) => void;
}

export default function CallModeConfig({ data, onChange }: CallModeConfigProps) {
  const { state } = useModel();
  const { models } = state;

  const handleCallTypeChange = (e: any) => {
    const type = e.target.value as 'direct' | 'dify';
    const newConfig: Partial<CharacterConfig> = {
      ...data,
      callConfig: {
        type,
        ...(type === 'direct' 
          ? { direct: { modelId: '' } }
          : { dify: { serverUrl: '', apiKey: '' } }
        )
      }
    };
    onChange(newConfig);
  };

  const handleDirectConfigChange = (field: string, value: string) => {
    const newConfig: Partial<CharacterConfig> = {
      ...data,
      callConfig: {
        type: 'direct',
        direct: {
          modelId: value
        }
      }
    };
    onChange(newConfig);
  };

  const handleDifyConfigChange = (field: string, value: string) => {
    const newConfig: Partial<CharacterConfig> = {
      ...data,
      callConfig: {
        type: 'dify',
        dify: {
          ...data.callConfig?.dify,
          [field]: value
        } as { serverUrl: string; apiKey: string }
      }
    };
    onChange(newConfig);
  };

  return (
    <div className="call-mode-config">
      <Form layout="vertical">
        <Form.Item label="调用方式">
          <Radio.Group 
            value={data.callConfig?.type || 'direct'} 
            onChange={handleCallTypeChange}
            className="call-type-group"
          >
            <Space direction="horizontal">
              <Radio value="direct">调用大模型</Radio>
              <Radio value="dify">Dify工作流</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        {data.callConfig?.type === 'direct' && (
          <div className="model-select-section">
            <Form.Item 
              label="选择模型配置" 
              required
              tooltip="从模型管理中选择已配置的模型"
            >
              <Select
                value={data.callConfig.direct?.modelId}
                onChange={(value) => handleDirectConfigChange('modelId', value)}
                placeholder="点击选择已配置的模型"
                className="model-select"
              >
                {models.map((model) => (
                  <Select.Option key={model.id} value={model.id}>
                    {model.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        )}

        {data.callConfig?.type === 'dify' && (
          <div className="dify-config-section">
            <Form.Item 
              label="Dify服务器地址" 
              required
              tooltip="输入Dify服务器的API地址"
            >
              <Input
                value={data.callConfig.dify?.serverUrl}
                onChange={(e) => handleDifyConfigChange('serverUrl', e.target.value)}
                placeholder="请输入Dify服务器地址"
              />
            </Form.Item>

            <Form.Item 
              label="API密钥" 
              required
              tooltip="输入Dify的API密钥"
            >
              <Input.Password
                value={data.callConfig.dify?.apiKey}
                onChange={(e) => handleDifyConfigChange('apiKey', e.target.value)}
                placeholder="请输入API密钥"
              />
            </Form.Item>
          </div>
        )}
      </Form>
    </div>
  );
} 