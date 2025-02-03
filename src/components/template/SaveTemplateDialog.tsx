import React, { useState } from 'react';
import { Modal, Input, Form, message } from 'antd';
import type { DebateConfig } from '../../types/debate';

export interface SaveTemplateDialogProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  config: DebateConfig;
}

export const SaveTemplateDialog: React.FC<SaveTemplateDialogProps> = ({
  visible,
  onClose,
  onSave,
  config,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onSave(values.name);
      form.resetFields();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="保存为模板"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} preserve={false}>
        <Form.Item
          name="name"
          label="模板名称"
          rules={[
            { required: true, message: '请输入模板名称' },
            { max: 50, message: '模板名称不能超过50个字符' }
          ]}
        >
          <Input placeholder="请输入模板名称" />
        </Form.Item>
      </Form>
    </Modal>
  );
}; 