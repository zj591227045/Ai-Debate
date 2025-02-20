import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Modal, Button, List, Tooltip, Upload, message } from 'antd';
import { DeleteOutlined, DownloadOutlined, UploadOutlined, ExportOutlined, ImportOutlined, SettingOutlined } from '@ant-design/icons';
import type { DebateConfig } from '../../types/debate';

const TemplateButton = styled(Button)`
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  height: 2rem;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    transform: translateY(-1px);
    background: ${({ theme }) => theme.colors.background.hover};
    border-color: ${({ theme }) => theme.colors.border.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  .anticon {
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const TemplateModal = styled(Modal)`
  .ant-modal-content {
    background: ${({ theme }) => theme.colors.background.primary};
    ${({ theme }) => theme.mixins.glassmorphism}
    border-radius: ${({ theme }) => theme.radius.lg};
  }

  .ant-modal-header {
    background: transparent;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  }

  .ant-modal-title {
    color: ${({ theme }) => theme.colors.text.primary};
    ${({ theme }) => theme.mixins.textGlow}
  }

  .ant-modal-close {
    color: ${({ theme }) => theme.colors.text.secondary};
  }

  .ant-modal-body {
    padding: 1.5rem;
  }

  p {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const TemplateList = styled(List<StoredTemplate>)`
  .ant-list-item {
    padding: 1rem;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.primary};
    background: ${({ theme }) => theme.colors.background.secondary};
    margin-bottom: 0.5rem;
    transition: all ${({ theme }) => theme.transitions.normal};

    &:hover {
      transform: translateY(-2px);
      border-color: ${({ theme }) => theme.colors.border.secondary};
      box-shadow: ${({ theme }) => theme.shadows.sm};
    }
  }
`;

const TemplateTitle = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  ${({ theme }) => theme.mixins.textGlow}
`;

const TemplateDescription = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: 0.25rem;
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled(Button)`
  padding: 0.25rem 0.5rem;
  height: auto;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text.secondary};

  &:hover {
    background: ${({ theme }) => theme.colors.background.hover};
    color: ${({ theme }) => theme.colors.primary};
  }

  &.delete-button:hover {
    color: ${({ theme }) => theme.colors.error};
  }
`;

const UploadWrapper = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px dashed ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.background.secondary};
  text-align: center;
  transition: all ${({ theme }) => theme.transitions.normal};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  .ant-upload-text {
    color: ${({ theme }) => theme.colors.text.primary};
  }

  .anticon {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

interface StoredTemplate extends Omit<DebateConfig, 'createdAt'> {
  id: string;
  name: string;
  createdAt: string;
}

interface TemplateManagerProps {
  currentConfig: DebateConfig;
  onLoadTemplate: (config: DebateConfig) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  currentConfig,
  onLoadTemplate,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [templates, setTemplates] = useState<StoredTemplate[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    try {
      const savedTemplates = JSON.parse(localStorage.getItem('debate_templates') || '{}');
      console.log('Loaded templates:', savedTemplates);
      
      const templatesArray = typeof savedTemplates === 'object' && savedTemplates !== null
        ? Object.values(savedTemplates)
        : [];
      
      console.log('Templates array:', templatesArray);
      
      const validTemplates = templatesArray.filter((template: any) => {
        const isValid = template && 
                       template.config && 
                       template.config.topic && 
                       typeof template.config.topic.title === 'string' &&
                       template.id;
        if (!isValid) {
          console.log('Invalid template:', template);
        }
        return isValid;
      }).map((template: any) => ({
        id: template.id,
        name: template.name || '未命名模板',
        topic: template.config.topic,
        rules: template.config.rules,
        judging: template.config.judging,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      })) as StoredTemplate[];
      
      console.log('Valid templates:', validTemplates);
      setTemplates(validTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      message.error('加载模板失败');
      setTemplates([]);
    }
  };

  const handleSaveTemplate = () => {
    try {
      if (!currentConfig.topic || !currentConfig.rules || !currentConfig.judging) {
        message.error('当前配置不完整，无法保存');
        return;
      }

      const templateId = Date.now().toString();
      const newTemplate = {
        id: templateId,
        name: currentConfig.topic.title || '未命名模板',
        config: {
          topic: {
            ...currentConfig.topic,
            title: currentConfig.topic.title || '未命名模板',
            description: currentConfig.topic.description || ''
          },
          rules: {
            ...currentConfig.rules,
            debateFormat: currentConfig.rules.debateFormat || 'free',
            description: currentConfig.rules.description || ''
          },
          judging: {
            ...currentConfig.judging,
            description: currentConfig.judging.description || '',
            dimensions: currentConfig.judging.dimensions || [],
            totalScore: currentConfig.judging.totalScore || 100
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const existingTemplates = JSON.parse(localStorage.getItem('debate_templates') || '{}');
      
      const updatedTemplates = {
        ...existingTemplates,
        [templateId]: newTemplate
      };
      
      localStorage.setItem('debate_templates', JSON.stringify(updatedTemplates));
      
      loadTemplates(); // 重新加载模板列表
      message.success('模板保存成功');
    } catch (error) {
      console.error('Failed to save template:', error);
      message.error('保存模板失败');
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    try {
      const existingTemplates = JSON.parse(localStorage.getItem('debate_templates') || '{}');
      
      if (!existingTemplates[templateId]) {
        message.error('模板不存在');
        return;
      }
      
      delete existingTemplates[templateId];
      
      localStorage.setItem('debate_templates', JSON.stringify(existingTemplates));
      
      const updatedTemplates = templates.filter(template => template.id !== templateId);
      setTemplates(updatedTemplates);
      
      message.success('模板删除成功');
    } catch (error) {
      console.error('Failed to delete template:', error);
      message.error('删除模板失败');
    }
  };

  const handleExportTemplate = (template: StoredTemplate) => {
    try {
      const dataStr = JSON.stringify(template, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `debate-template-${template.id}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Failed to export template:', error);
      message.error('导出模板失败');
    }
  };

  const handleImportTemplate = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const template = JSON.parse(e.target?.result as string);
        if (!template.topic || !template.rules || !template.judging) {
          throw new Error('Invalid template format');
        }
        const convertedTemplate: DebateConfig = {
          ...template,
          createdAt: new Date(template.createdAt || new Date()),
          updatedAt: template.updatedAt ? new Date(template.updatedAt) : undefined,
        };
        onLoadTemplate(convertedTemplate);
        message.success('模板导入成功');
      } catch (error) {
        console.error('Failed to import template:', error);
        message.error('导入模板失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const handleLoadTemplate = (template: StoredTemplate) => {
    const convertedTemplate: DebateConfig = {
      ...template,
      topic: template.topic,
      rules: template.rules,
      judging: template.judging,
      createdAt: new Date(template.createdAt),
      updatedAt: template.updatedAt ? new Date(template.updatedAt) : undefined,
    };
    onLoadTemplate(convertedTemplate);
  };

  const renderTemplateItem = (item: StoredTemplate) => {
    if (!item || !item.topic) {
      return null;
    }

    return (
      <List.Item>
        <div>
          <TemplateTitle>{item.name}</TemplateTitle>
          <TemplateDescription>{item.topic.title}</TemplateDescription>
        </div>
        <ActionGroup>
          <Tooltip title="使用此模板">
            <ActionButton onClick={() => handleLoadTemplate(item)}>
              <ImportOutlined />
            </ActionButton>
          </Tooltip>
          <Tooltip title="导出模板">
            <ActionButton onClick={() => handleExportTemplate(item)}>
              <ExportOutlined />
            </ActionButton>
          </Tooltip>
          <Tooltip title="删除模板">
            <ActionButton 
              className="delete-button"
              onClick={() => handleDeleteTemplate(item.id)}
            >
              <DeleteOutlined />
            </ActionButton>
          </Tooltip>
        </ActionGroup>
      </List.Item>
    );
  };

  return (
    <>
      <TemplateButton onClick={() => setIsModalVisible(true)}>
        <SettingOutlined />
        模板管理
      </TemplateButton>

      <TemplateModal
        title="模板管理"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <UploadWrapper>
          <Upload.Dragger
            accept=".json"
            beforeUpload={handleImportTemplate}
            showUploadList={false}
          >
            <p style={{ color: '#E8F0FF' }}>
              <UploadOutlined /> 点击或拖拽文件到此处导入模板
            </p>
          </Upload.Dragger>
        </UploadWrapper>

        <Button 
          type="primary" 
          onClick={handleSaveTemplate}
          style={{ marginBottom: '1rem' }}
        >
          保存当前配置为模板
        </Button>

        {templates.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            color: '#E8F0FF',
            opacity: 0.8 
          }}>
            暂无模板
          </div>
        ) : (
          <TemplateList
            dataSource={templates}
            renderItem={renderTemplateItem}
          />
        )}
      </TemplateModal>
    </>
  );
}; 