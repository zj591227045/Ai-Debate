import React from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Upload,
  Button,
  Divider,
  Space,
  Tabs,
  message,
  Modal,
} from 'antd';
import { UploadOutlined, SaveOutlined, DeleteOutlined, FileOutlined } from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';
import type { RcFile } from 'antd/es/upload';
import {
  CharacterConfig,
  personalityOptions,
  speakingStyleOptions,
  backgroundOptions,
  valueOptions,
  argumentationStyleOptions,
} from '../types';
import { TemplateSelector } from './TemplateSelector';
import { defaultTemplates } from '../types/template';
import './CharacterConfigForm.css';

interface CharacterConfigFormProps {
  initialValues?: Partial<CharacterConfig>;
  onSave: (values: CharacterConfig) => void;
  onDelete?: () => void;
}

const { TabPane } = Tabs;
const { TextArea } = Input;

export const CharacterConfigForm: React.FC<CharacterConfigFormProps> = ({
  initialValues,
  onSave,
  onDelete,
}) => {
  const [form] = Form.useForm();
  const [isTemplateModalVisible, setIsTemplateModalVisible] = React.useState(false);

  // 头像上传配置
  const uploadProps: UploadProps = {
    name: 'avatar',
    maxCount: 1,
    beforeUpload: (file: RcFile) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件！');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片必须小于 2MB！');
        return false;
      }
      return true;
    },
    onChange: (info: { file: UploadFile }) => {
      if (info.file.status === 'done') {
        message.success('头像上传成功！');
      } else if (info.file.status === 'error') {
        message.error('头像上传失败！');
      }
    },
  };

  const handleSubmit = (values: any) => {
    onSave(values as CharacterConfig);
    message.success('保存成功！');
  };

  const handleTemplateSelect = (templateValues: Partial<CharacterConfig>) => {
    form.setFieldsValue(templateValues);
    setIsTemplateModalVisible(false);
    message.success('已应用模板设置');
  };

  return (
    <Card className="character-config-form">
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleSubmit}
        className="max-w-3xl mx-auto"
      >
        <div className="flex justify-end mb-4">
          <Button
            icon={<FileOutlined />}
            onClick={() => setIsTemplateModalVisible(true)}
          >
            使用预设模板
          </Button>
        </div>

        <Tabs defaultActiveKey="basic">
          <TabPane tab="基本信息" key="basic">
            <Space direction="vertical" className="w-full">
              <Form.Item
                name="name"
                label="角色名称"
                rules={[{ required: true, message: '请输入角色名称' }]}
              >
                <Input placeholder="请输入角色名称" />
              </Form.Item>

              <Form.Item
                name="avatar"
                label="角色头像"
              >
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>上传头像</Button>
                </Upload>
              </Form.Item>

              <Form.Item
                name="description"
                label="角色描述"
              >
                <TextArea
                  placeholder="请输入角色描述"
                  autoSize={{ minRows: 3, maxRows: 6 }}
                />
              </Form.Item>
            </Space>
          </TabPane>

          <TabPane tab="人设配置" key="persona">
            <Space direction="vertical" className="w-full">
              <Form.Item
                name={['persona', 'personality']}
                label="性格特征"
                rules={[{ required: true, message: '请选择至少一个性格特征' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择性格特征"
                  options={personalityOptions.map(opt => ({ label: opt, value: opt }))}
                />
              </Form.Item>

              <Form.Item
                name={['persona', 'speakingStyle']}
                label="说话风格"
                rules={[{ required: true, message: '请选择说话风格' }]}
              >
                <Select
                  placeholder="请选择说话风格"
                  options={speakingStyleOptions.map(opt => ({ label: opt, value: opt }))}
                />
              </Form.Item>

              <Form.Item
                name={['persona', 'background']}
                label="专业背景"
                rules={[{ required: true, message: '请选择专业背景' }]}
              >
                <Select
                  placeholder="请选择专业背景"
                  options={backgroundOptions.map(opt => ({ label: opt, value: opt }))}
                />
              </Form.Item>

              <Form.Item
                name={['persona', 'values']}
                label="价值观"
                rules={[{ required: true, message: '请选择至少一个价值观' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择价值观"
                  options={valueOptions.map(opt => ({ label: opt, value: opt }))}
                />
              </Form.Item>

              <Form.Item
                name={['persona', 'argumentationStyle']}
                label="论证风格"
                rules={[{ required: true, message: '请选择至少一个论证风格' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择论证风格"
                  options={argumentationStyleOptions.map(opt => ({ label: opt, value: opt }))}
                />
              </Form.Item>

              <Form.Item
                name={['persona', 'customDescription']}
                label="自定义人设描述"
              >
                <TextArea
                  placeholder="请输入自定义人设描述"
                  autoSize={{ minRows: 3, maxRows: 6 }}
                />
              </Form.Item>
            </Space>
          </TabPane>

          <TabPane tab="模型配置" key="model">
            <Space direction="vertical" className="w-full">
              <Form.Item
                name="modelId"
                label="关联模型"
                rules={[{ required: true, message: '请选择关联模型' }]}
              >
                <Select
                  placeholder="请选择关联模型"
                  options={[
                    { label: 'GPT-4', value: 'gpt4' },
                    { label: 'Claude 2', value: 'claude2' },
                    // 更多模型选项...
                  ]}
                />
              </Form.Item>
            </Space>
          </TabPane>
        </Tabs>

        <Divider />

        <Form.Item className="flex justify-end">
          <Space>
            {onDelete && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={onDelete}
              >
                删除
              </Button>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
            >
              保存
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Modal
        title="选择预设模板"
        open={isTemplateModalVisible}
        onCancel={() => setIsTemplateModalVisible(false)}
        footer={null}
      >
        <TemplateSelector 
          templates={defaultTemplates}
          onSelect={handleTemplateSelect} 
        />
      </Modal>
    </Card>
  );
}; 