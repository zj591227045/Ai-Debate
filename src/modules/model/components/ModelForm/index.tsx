import React from 'react';
import { Form, Input, Select, InputNumber, Modal } from 'antd';
import styled from '@emotion/styled';
import { PROVIDERS } from '../../types/providers';
import type { ModelConfig } from '../../types';

const StyledModal = styled(Modal)`
  .ant-modal-content {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(167,187,255,0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  }

  .ant-modal-header {
    background: transparent;
    border-bottom: 1px solid rgba(167,187,255,0.1);
  }

  .ant-modal-title {
    color: #E8F0FF;
  }

  .ant-modal-close {
    color: rgba(232,240,255,0.7);
    
    &:hover {
      color: #E8F0FF;
    }
  }

  .ant-modal-body {
    padding: 2rem;
  }

  .ant-modal-footer {
    border-top: 1px solid rgba(167,187,255,0.1);
    padding: 1rem 2rem;

    .ant-btn {
      height: 40px;
      font-weight: 500;
      transition: all 0.3s ease;

      &-default {
        background: rgba(167,187,255,0.1);
        border: 1px solid rgba(167,187,255,0.2);
        color: rgba(232,240,255,0.9);

        &:hover {
          background: rgba(167,187,255,0.2);
          border-color: rgba(167,187,255,0.3);
          color: #E8F0FF;
        }
      }

      &-primary {
        background: linear-gradient(45deg, rgba(9,9,121,0.9), rgba(0,57,89,0.9));
        border: 1px solid rgba(167,187,255,0.3);
        color: #E8F0FF;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(31, 38, 135, 0.3);
          border-color: rgba(167,187,255,0.4);
        }
      }
    }
  }
`;

const StyledForm = styled(Form)`
  .ant-form-item-label > label {
    color: rgba(232,240,255,0.9);
  }

  .ant-input,
  .ant-input-number,
  .ant-select-selector {
    background: rgba(167,187,255,0.05) !important;
    border: 1px solid rgba(167,187,255,0.2) !important;
    border-radius: 8px !important;
    color: #E8F0FF !important;

    &:hover {
      border-color: #4157ff !important;
      background: rgba(167,187,255,0.1) !important;
    }

    &:focus,
    &-focused {
      border-color: #4157ff !important;
      box-shadow: 0 0 0 2px rgba(65, 87, 255, 0.2) !important;
    }
  }

  .ant-input-number-handler-wrap {
    background: rgba(167,187,255,0.1);
    border-left: 1px solid rgba(167,187,255,0.2);

    .ant-input-number-handler {
      border-color: rgba(167,187,255,0.2);
      
      &:hover {
        .ant-input-number-handler-up-inner,
        .ant-input-number-handler-down-inner {
          color: #4157ff;
        }
      }
    }

    .ant-input-number-handler-up-inner,
    .ant-input-number-handler-down-inner {
      color: rgba(232,240,255,0.7);
    }
  }

  .ant-select-arrow {
    color: rgba(232,240,255,0.7);
  }

  .ant-form-item-explain-error {
    color: #ff4157;
  }
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.5rem;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  align-items: start;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FormItem = styled(Form.Item)`
  margin-bottom: 0 !important;

  .ant-form-item-label {
    padding-bottom: 4px;
    
    > label {
      color: rgba(232,240,255,0.9);
      font-size: 0.9rem;
      height: 28px;
      
      &.ant-form-item-required::before {
        color: #ff4157;
      }
    }
  }

  .ant-form-item-explain-error {
    color: #ff4157;
    font-size: 0.8rem;
    margin-top: 4px;
  }
`;

const StyledInput = styled(Input)`
  background: rgba(65, 87, 255, 0.1) !important;
  border: 1px solid rgba(65, 87, 255, 0.2) !important;
  color: #E8F0FF !important;
  border-radius: 8px;
  height: 40px;

  &::placeholder {
    color: rgba(232, 240, 255, 0.6) !important;
  }

  &:hover, &:focus {
    background: rgba(65, 87, 255, 0.15) !important;
    border-color: rgba(65, 87, 255, 0.3) !important;
  }
`;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    background: rgba(65, 87, 255, 0.1) !important;
    border: 1px solid rgba(65, 87, 255, 0.2) !important;
    border-radius: 8px !important;
    height: 40px !important;
    padding: 4px 12px !important;

    .ant-select-selection-placeholder {
      color: rgba(232, 240, 255, 0.6) !important;
    }

    .ant-select-selection-item {
      color: #E8F0FF !important;
      line-height: 30px !important;
    }
  }

  &:hover, &.ant-select-focused {
    .ant-select-selector {
      background: rgba(65, 87, 255, 0.15) !important;
      border-color: rgba(65, 87, 255, 0.3) !important;
    }
  }

  .ant-select-arrow {
    color: rgba(232, 240, 255, 0.6) !important;
  }
`;

const StyledInputNumber = styled(InputNumber)`
  background: rgba(65, 87, 255, 0.1) !important;
  border: 1px solid rgba(65, 87, 255, 0.2) !important;
  border-radius: 8px !important;
  width: 100% !important;

  .ant-input-number-input {
    color: #E8F0FF !important;
    height: 38px !important;
  }

  &:hover, &:focus {
    background: rgba(65, 87, 255, 0.15) !important;
    border-color: rgba(65, 87, 255, 0.3) !important;
  }

  .ant-input-number-handler-wrap {
    background: rgba(65, 87, 255, 0.2) !important;
    border-left: 1px solid rgba(65, 87, 255, 0.2) !important;

    .ant-input-number-handler {
      border-color: rgba(65, 87, 255, 0.2) !important;
      
      &:hover {
        .ant-input-number-handler-up-inner,
        .ant-input-number-handler-down-inner {
          color: #E8F0FF !important;
        }
      }
    }

    .ant-input-number-handler-up-inner,
    .ant-input-number-handler-down-inner {
      color: rgba(232, 240, 255, 0.6) !important;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(167,187,255,0.1);
`;

const Button = styled.button<{ $primary?: boolean }>`
  height: 40px;
  padding: 0 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  ${props => props.$primary ? `
    background: linear-gradient(45deg, rgba(9,9,121,0.9), rgba(0,57,89,0.9));
    border: 1px solid rgba(167,187,255,0.3);
    color: #E8F0FF;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(31, 38, 135, 0.3);
      border-color: rgba(167,187,255,0.4);
    }
  ` : `
    background: rgba(167,187,255,0.1);
    border: 1px solid rgba(167,187,255,0.2);
    color: rgba(232,240,255,0.9);
    
    &:hover {
      background: rgba(167,187,255,0.2);
      border-color: rgba(167,187,255,0.3);
      color: #E8F0FF;
    }
  `}
`;

interface ModelFormProps {
  visible: boolean;
  initialValues?: ModelConfig;
  onCancel: () => void;
  onSubmit: (values: ModelConfig) => void;
}

const ModelForm: React.FC<ModelFormProps> = ({
  visible,
  initialValues,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit({
        ...initialValues,
        ...values,
        updatedAt: Date.now(),
        createdAt: initialValues?.createdAt || Date.now(),
      });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <StyledModal
      title={initialValues ? '编辑模型' : '添加模型'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      width={600}
      centered
      destroyOnClose
    >
      <FormContainer>
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          preserve={false}
        >
          <FormSection>
            <FormItem
              name="name"
              label="模型名称"
              rules={[{ required: true, message: '请输入模型名称' }]}
            >
              <StyledInput placeholder="请输入模型名称" />
            </FormItem>

            <FormRow>
              <FormItem
                name="provider"
                label="提供商"
                rules={[{ required: true, message: '请选择提供商' }]}
              >
                <StyledSelect placeholder="请选择提供商">
                  {Object.values(PROVIDERS).map(provider => (
                    <Select.Option key={provider} value={provider}>
                      {provider}
                    </Select.Option>
                  ))}
                </StyledSelect>
              </FormItem>

              <FormItem
                name="model"
                label="模型"
                rules={[{ required: true, message: '请输入模型' }]}
              >
                <StyledInput placeholder="请输入模型" />
              </FormItem>
            </FormRow>

            <FormItem
              name="endpoint"
              label="服务地址"
            >
              <StyledInput placeholder="请输入服务地址（可选）" />
            </FormItem>

            <FormRow>
              <FormItem
                name="temperature"
                label="温度"
                initialValue={0.7}
              >
                <StyledInputNumber
                  min={0}
                  max={2}
                  step={0.1}
                  style={{ width: '100%' }}
                />
              </FormItem>

              <FormItem
                name="maxTokens"
                label="最大Token数"
                initialValue={2048}
              >
                <StyledInputNumber
                  min={1}
                  max={8192}
                  style={{ width: '100%' }}
                />
              </FormItem>
            </FormRow>

            <FormItem
              name="topP"
              label="Top P"
              initialValue={0.9}
            >
              <StyledInputNumber
                min={0}
                max={1}
                step={0.1}
                style={{ width: '100%' }}
              />
            </FormItem>
          </FormSection>

          <ActionButtons>
            <Button onClick={onCancel}>
              取消
            </Button>
            <Button $primary onClick={handleSubmit}>
              确定
            </Button>
          </ActionButtons>
        </Form>
      </FormContainer>
    </StyledModal>
  );
};

export default ModelForm; 