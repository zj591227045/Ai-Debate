import React, { useState } from 'react';
import { Form, Input, Upload, Button, Modal, message, Radio, Space } from 'antd';
import { UploadOutlined, FileOutlined, UserOutlined, LinkOutlined } from '@ant-design/icons';
import { CharacterConfig } from '../../types';
import { defaultTemplates, templateToCharacter } from '../../types/template';
import { TemplateSelector } from '../../components/TemplateSelector';
import type { UploadProps } from 'antd';
import type { RcFile } from 'antd/es/upload';

const { TextArea } = Input;

interface BasicInfoProps {
  data: Partial<CharacterConfig>;
  onChange: (data: Partial<CharacterConfig>) => void;
}

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

  const handleAvatarTypeChange = (e: any) => {
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
        <div className="form-section">
          <div className="form-section-title">
            <FileOutlined /> 使用模板
          </div>
          <Button 
            type="dashed" 
            icon={<FileOutlined />} 
            onClick={() => setIsTemplateModalVisible(true)}
            block
          >
            选择预设模板
          </Button>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <UserOutlined /> 基本信息
          </div>
          <div className="form-row">
            <div className="form-col">
              <Form.Item 
                label="角色名称" 
                required 
                tooltip="给你的AI辩手起一个响亮的名字"
              >
                <Input
                  value={data.name}
                  onChange={(e) => onChange({ ...data, name: e.target.value })}
                  placeholder="请输入角色名称"
                />
              </Form.Item>
            </div>
            <div className="form-col">
              <Form.Item 
                label="角色头像" 
                tooltip="上传一个代表角色形象的头像"
              >
                <div className="avatar-section">
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
                </div>
              </Form.Item>
            </div>
          </div>

          <Form.Item 
            label="角色简介" 
            tooltip="描述这个AI辩手的特点和专长"
          >
            <TextArea
              value={data.description}
              onChange={(e) => onChange({ ...data, description: e.target.value })}
              placeholder="请输入角色简介"
              rows={4}
            />
          </Form.Item>
        </div>
      </Form>

      <Modal
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
      </Modal>
    </div>
  );
} 