import React, { useState } from 'react';
import { Modal, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { DebateConfig } from '../../types/debate';
import { TemplateManager } from '../../services/TemplateManager';

const { Dragger } = Upload;

export interface LoadTemplateDialogProps {
  visible: boolean;
  onClose: () => void;
  onLoad: (config: DebateConfig) => void;
}

export const LoadTemplateDialog: React.FC<LoadTemplateDialogProps> = ({
  visible,
  onClose,
  onLoad,
}) => {
  const [loading, setLoading] = useState(false);

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.json',
    showUploadList: false,
    customRequest: async ({ file }) => {
      if (!(file instanceof File)) {
        message.error('无效的文件');
        return;
      }

      try {
        setLoading(true);
        const config = await TemplateManager.loadFromFile(file);
        onLoad(config);
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message);
        } else {
          message.error('加载模板失败');
        }
      } finally {
        setLoading(false);
      }
    },
  };

  return (
    <Modal
      title="加载模板"
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          点击或拖拽文件到此区域
        </p>
        <p className="ant-upload-hint">
          支持加载.json格式的模板文件
        </p>
      </Dragger>
    </Modal>
  );
}; 