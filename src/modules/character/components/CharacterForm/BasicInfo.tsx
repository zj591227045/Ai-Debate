import React, { useState } from 'react';
import { Form, Input, Upload, Button, Modal, message, Radio, Space } from 'antd';
import { UploadOutlined, FileOutlined, UserOutlined, LinkOutlined } from '@ant-design/icons';
import { CharacterConfig } from '../../types';
import { defaultTemplates, templateToCharacter } from '../../types/template';
import { TemplateSelector } from '../../components/TemplateSelector';
import type { UploadProps } from 'antd';
import type { RcFile } from 'antd/es/upload';
import styled from '@emotion/styled';
import type { RadioChangeEvent } from 'antd';

const { TextArea } = Input;

interface BasicInfoProps {
  data: Partial<CharacterConfig>;
  onChange: (data: Partial<CharacterConfig>) => void;
}

const FormSection = styled.div`
  .form-section-title {
    color: #E8F0FF;
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .anticon {
      color: rgba(232,240,255,0.7);
    }
  }
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;

  .ant-form-item {
    flex: 1;
  }

  .ant-form-item-label > label {
    color: #E8F0FF;
  }

  .ant-form-item-tooltip {
    color: rgba(232,240,255,0.7);
  }
`;

const AvatarSection = styled.div`
  .avatar-preview {
    margin-bottom: 1rem;
    
    img {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #4157ff;
    }
  }

  .avatar-type-select {
    margin-bottom: 1rem;
    
    .ant-radio-wrapper {
      color: #E8F0FF;
    }
  }

  .avatar-input {
    .ant-upload {
      width: 100%;
    }
  }
`;

const StyledInput = styled(Input)`
  background: #1a1a2e;
  border: 1px solid #4157ff;
  color: #E8F0FF;

  &::placeholder {
    color: rgba(232,240,255,0.5);
  }

  &:hover, &:focus {
    border-color: #6677ff;
    background: #1f1f3a;
  }
`;

const StyledTextArea = styled(TextArea)`
  background: #1a1a2e;
  border: 1px solid #4157ff;
  color: #E8F0FF;

  &::placeholder {
    color: rgba(232,240,255,0.5);
  }

  &:hover, &:focus {
    border-color: #6677ff;
    background: #1f1f3a;
  }
`;

const StyledButton = styled(Button)`
  color: #E8F0FF;
  border-color: #4157ff;
  background: #1a1a2e;

  &:hover {
    color: #E8F0FF;
    border-color: #6677ff;
    background: #1f1f3a;
  }

  .anticon {
    color: #E8F0FF;
  }
`;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    background: #1a1a2e;
    border: 1px solid #4157ff;
  }

  .ant-modal-header {
    background: #1a1a2e;
    border-bottom: 1px solid #4157ff;
  }

  .ant-modal-title {
    color: #E8F0FF;
  }

  .ant-modal-close {
    color: #E8F0FF;
    
    &:hover {
      color: #6677ff;
    }
  }
`;

export default function BasicInfo({ data, onChange }: BasicInfoProps) {
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [avatarType, setAvatarType] = useState<'upload' | 'url'>(data.avatar?.startsWith('http') ? 'url' : 'upload');
  const [avatarUrl, setAvatarUrl] = useState(data.avatar?.startsWith('http') ? data.avatar : '');

  const handleTemplateSelect = (templateData: Partial<CharacterConfig>) => {
    onChange({
      ...data,
      ...templateData,
    });
    setIsTemplateModalVisible(false);
    message.success('已应用模板');
  };

  const handleAvatarTypeChange = (e: RadioChangeEvent) => {
    setAvatarType(e.target.value);
    // 切换类型时清空另一种类型的值
    if (e.target.value === 'url') {
      onChange({ ...data, avatar: avatarUrl });
    } else {
      setAvatarUrl('');
      onChange({ ...data, avatar: '' });
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setAvatarUrl(url);
    // 确保URL有效
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      onChange({ ...data, avatar: url });
    } else if (!url) {
      onChange({ ...data, avatar: undefined });
    }
  };

  const uploadProps: UploadProps = {
    name: 'avatar',
    showUploadList: false,
    beforeUpload: (file: RcFile) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件！');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过2MB！');
        return false;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const avatar = e.target?.result as string;
        onChange({
          ...data,
          avatar
        });
        message.success('头像上传成功');
      };
      reader.readAsDataURL(file);
      return false;
    },
  };

  const renderAvatarUpload = () => {
    if (avatarType === 'url') {
      return (
        <Input
          value={avatarUrl}
          onChange={handleUrlChange}
          placeholder="请输入图片URL地址"
          prefix={<LinkOutlined />}
        />
      );
    }

    return (
      <Upload {...uploadProps}>
        <div className="avatar-upload">
          <Button icon={<UploadOutlined />}>
            {data.avatar && avatarType === 'upload' ? '更换头像' : '上传头像'}
          </Button>
        </div>
      </Upload>
    );
  };

  return (
    <div className="basic-info">
      <Form layout="vertical">
        <FormSection>
          <div className="form-section-title">
            <FileOutlined /> 使用模板
          </div>
          <StyledButton 
            type="dashed" 
            icon={<FileOutlined />} 
            onClick={() => setIsTemplateModalVisible(true)}
            block
          >
            选择预设模板
          </StyledButton>
        </FormSection>

        <FormSection>
          <div className="form-section-title">
            <UserOutlined /> 基本信息
          </div>
          <FormRow>
            <Form.Item 
              label="角色名称" 
              required 
              tooltip="给你的AI辩手起一个响亮的名字"
            >
              <StyledInput
                value={data.name}
                onChange={(e) => onChange({ ...data, name: e.target.value })}
                placeholder="请输入角色名称"
              />
            </Form.Item>
          </FormRow>

          <FormRow>
            <Form.Item 
              label="角色头像" 
              tooltip="上传一个代表角色形象的头像"
            >
              <AvatarSection>
                {data.avatar && (
                  <div className="avatar-preview">
                    <img src={data.avatar} alt="角色头像" />
                  </div>
                )}
                <div className="avatar-input">
                  <Radio.Group 
                    value={avatarType} 
                    onChange={handleAvatarTypeChange}
                    className="avatar-type-select"
                  >
                    <Space direction="vertical">
                      <Radio value="upload">本地上传</Radio>
                      <Radio value="url">图片URL</Radio>
                    </Space>
                  </Radio.Group>
                  <div className="avatar-input-content">
                    {renderAvatarUpload()}
                  </div>
                </div>
              </AvatarSection>
            </Form.Item>
          </FormRow>

          <FormRow>
            <Form.Item 
              label="角色简介" 
              tooltip="描述这个AI辩手的特点和专长"
            >
              <StyledTextArea
                value={data.description}
                onChange={(e) => onChange({ ...data, description: e.target.value })}
                placeholder="请输入角色简介"
                rows={4}
              />
            </Form.Item>
          </FormRow>
        </FormSection>
      </Form>

      <StyledModal
        title="选择预设模板"
        open={isTemplateModalVisible}
        onCancel={() => setIsTemplateModalVisible(false)}
        footer={null}
        width={800}
      >
        <TemplateSelector
          templates={defaultTemplates}
          onSelect={handleTemplateSelect}
        />
      </StyledModal>
    </div>
  );
} 