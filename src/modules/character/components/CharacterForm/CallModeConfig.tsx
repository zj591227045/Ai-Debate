import React from 'react';
import { Select, Radio, Input } from 'antd';
import type { RadioChangeEvent } from 'antd';
import type { SelectProps } from 'antd/es/select';
import { useModel } from '../../../model/context/ModelContext';
import type { CharacterConfig } from '../../types/character';
import type { ModelConfig } from '../../../model/types';
import { PROVIDERS } from '../../../llm/types/providers';
import styled from '@emotion/styled';
import type { ChangeEvent } from 'react';

// 添加styled-components样式
const ConfigContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  color: #E8F0FF;
`;

const FormItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.9rem;
    color: rgba(232,240,255,0.9);
    font-weight: 500;
  }

  .ant-radio-group {
    display: flex;
    gap: 1rem;
  }

  .ant-radio-wrapper {
    color: rgba(232,240,255,0.9);
    
    &:hover {
      .ant-radio-inner {
        border-color: #4157ff;
      }
    }
  }

  .ant-radio-checked {
    .ant-radio-inner {
      background-color: #4157ff;
      border-color: #4157ff;
    }
  }
`;

const StyledInput = styled(Input)`
  background: rgba(167,187,255,0.05);
  border: 1px solid rgba(167,187,255,0.2);
  border-radius: 8px;
  color: #E8F0FF;
  height: 40px;

  &:hover, &:focus {
    border-color: #4157ff;
    background: rgba(167,187,255,0.1);
  }

  &::placeholder {
    color: rgba(232,240,255,0.5);
  }
`;

const StyledPasswordInput = styled(Input.Password)`
  background: rgba(167,187,255,0.05);
  border: 1px solid rgba(167,187,255,0.2);
  border-radius: 8px;
  color: #E8F0FF;
  height: 40px;

  &:hover, &:focus {
    border-color: #4157ff;
    background: rgba(167,187,255,0.1);
  }

  &::placeholder {
    color: rgba(232,240,255,0.5);
  }

  .ant-input {
    background: transparent;
    color: #E8F0FF;
  }

  .ant-input-password-icon {
    color: rgba(232,240,255,0.7);
    
    &:hover {
      color: #E8F0FF;
    }
  }
`;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    background: rgba(167,187,255,0.05) !important;
    border: 1px solid rgba(167,187,255,0.2) !important;
    border-radius: 8px !important;
    height: 40px !important;
    padding: 4px 12px !important;

    .ant-select-selection-item {
      color: #E8F0FF;
      line-height: 30px;
    }
  }

  &:hover {
    .ant-select-selector {
      border-color: #4157ff !important;
      background: rgba(167,187,255,0.1) !important;
    }
  }

  &.ant-select-focused {
    .ant-select-selector {
      border-color: #4157ff !important;
      box-shadow: 0 0 0 2px rgba(65, 87, 255, 0.2) !important;
    }
  }

  .ant-select-arrow {
    color: rgba(232,240,255,0.7);
  }
`;

interface CallModeConfigProps {
  data: CharacterConfig;
  onChange: (config: Partial<CharacterConfig>) => void;
}

// 创建一个HOC来处理model context
const withModel = (WrappedComponent: React.ComponentType<any>) => {
  return function WithModelComponent(props: CallModeConfigProps) {
    const modelContext = useModel();
    return <WrappedComponent {...props} models={modelContext.models} />;
  };
};

class CallModeConfigComponent extends React.Component<CallModeConfigProps & { models: ModelConfig[] }> {
  handleCallTypeChange = (e: RadioChangeEvent) => {
    const type = e.target.value as "direct" | "dify";
    this.props.onChange({
      ...this.props.data,
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

  handleDifyConfigChange = (field: string, value: string) => {
    this.props.onChange({
      ...this.props.data,
      callConfig: {
        ...this.props.data.callConfig,
        type: 'dify',
        dify: {
          serverUrl: field === 'serverUrl' ? value : (this.props.data.callConfig?.dify?.serverUrl || ''),
          apiKey: field === 'apiKey' ? value : (this.props.data.callConfig?.dify?.apiKey || '')
        }
      }
    });
  };

  handleDirectConfigChange = (value: unknown) => {
    if (typeof value !== 'string') return;
    
    const model = this.props.models.find((m: ModelConfig) => m.id === value);
    this.props.onChange({
      ...this.props.data,
      callConfig: {
        ...this.props.data.callConfig,
        type: 'direct',
        direct: {
          provider: model?.provider || PROVIDERS.OLLAMA,
          modelId: value,
          model: model?.model || ''
        }
      }
    });
  };

  render() {
    const { data, models } = this.props;

    return (
      <ConfigContainer>
        <FormItem>
          <label>调用方式</label>
          <Radio.Group
            value={data.callConfig?.type || 'direct'}
            onChange={this.handleCallTypeChange}
          >
            <Radio value="direct">直接调用</Radio>
            <Radio value="dify">Dify API</Radio>
          </Radio.Group>
        </FormItem>

        {data.callConfig?.type === 'dify' ? (
          <>
            <FormItem>
              <label>服务器地址</label>
              <StyledInput
                value={data.callConfig?.dify?.serverUrl || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => 
                  this.handleDifyConfigChange('serverUrl', e.target.value)
                }
                placeholder="请输入Dify服务器地址"
              />
            </FormItem>
            <FormItem>
              <label>API Key</label>
              <StyledPasswordInput
                value={data.callConfig?.dify?.apiKey || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => 
                  this.handleDifyConfigChange('apiKey', e.target.value)
                }
                placeholder="请输入Dify API Key"
              />
            </FormItem>
          </>
        ) : (
          <FormItem>
            <label>选择模型</label>
            <StyledSelect
              value={data.callConfig?.direct?.modelId || ''}
              onChange={this.handleDirectConfigChange}
              placeholder="请选择模型"
            >
              {models.map((model: ModelConfig) => (
                <Select.Option key={model.id} value={model.id}>
                  {model.name}
                </Select.Option>
              ))}
            </StyledSelect>
          </FormItem>
        )}
      </ConfigContainer>
    );
  }
}

export default withModel(CallModeConfigComponent); 