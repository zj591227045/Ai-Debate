import React, { useState, useEffect } from 'react';
import { Select, Button, Space, message } from 'antd';
import type { SelectProps } from 'antd';
import styled from '@emotion/styled';
import { TemplateManager as TemplateService } from '../../services/TemplateManager';
import { SaveTemplateDialog } from './SaveTemplateDialog';
import { LoadTemplateDialog } from './LoadTemplateDialog';
import type { Template } from '../../services/TemplateManager';
import type { DebateConfig } from '../../types/debate';
import { TemplateInfo } from './TemplateInfo';

interface TemplateManagerProps {
  currentConfig: DebateConfig;
  onLoadTemplate: (config: DebateConfig) => void;
}

const TemplateContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledSelect = styled(Select)`
  min-width: 200px;
`;

const StyledButton = styled(Button)`
  height: 32px;
  padding: 4px 15px;
  border-radius: 6px;
  
  &.ant-btn-primary {
    background-color: #4157ff;
    border-color: #4157ff;
  }
  
  &.ant-btn-default {
    border-color: #d9d9d9;
    
    &:hover {
      color: #4157ff;
      border-color: #4157ff;
    }
  }
`;

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  currentConfig,
  onLoadTemplate,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  // 获取当前选中的模板
  const currentTemplate = templates.find(t => t.id === selectedTemplate) || null;

  useEffect(() => {
    loadTemplates();
  }, []);

  // 加载所有模板
  const loadTemplates = async () => {
    try {
      const loadedTemplates = await TemplateService.loadTemplates();
      setTemplates(loadedTemplates);
    } catch (error) {
      message.error('加载模板列表失败');
    }
  };

  // 处理模板选择
  const handleTemplateSelect: SelectProps['onChange'] = (value) => {
    const templateId = value as string;
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      onLoadTemplate(template.config);
      message.success('已加载模板');
    }
  };

  // 处理保存模板
  const handleSaveTemplate = async (name: string) => {
    try {
      await TemplateService.saveTemplate({
        name,
        config: currentConfig,
      });
      message.success('模板保存成功');
      setShowSaveDialog(false);
      loadTemplates(); // 刷新模板列表
    } catch (error) {
      message.error('保存模板失败');
    }
  };

  // 处理从文件加载模板
  const handleLoadFromFile = async (config: DebateConfig) => {
    onLoadTemplate(config);
    setShowLoadDialog(false);
    message.success('已从文件加载模板');
  };

  // 处理导出模板
  const handleExportTemplate = async () => {
    if (!selectedTemplate) {
      message.warning('请先选择要导出的模板');
      return;
    }
    
    try {
      await TemplateService.downloadTemplate(selectedTemplate);
      message.success('模板导出成功');
    } catch (error) {
      message.error('导出模板失败');
    }
  };

  return (
    <TemplateContainer>
      <StyledSelect
        placeholder="选择模板"
        value={selectedTemplate}
        onChange={handleTemplateSelect}
        options={templates.map(t => ({
          label: t.name,
          value: t.id,
        }))}
      />
      <Space>
        <StyledButton onClick={() => setShowLoadDialog(true)}>
          导入模板
        </StyledButton>
        <StyledButton onClick={handleExportTemplate}>
          导出模板
        </StyledButton>
        <StyledButton type="primary" onClick={() => setShowSaveDialog(true)}>
          保存为模板
        </StyledButton>
      </Space>

      <TemplateInfo template={currentTemplate} />

      <SaveTemplateDialog
        visible={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveTemplate}
        config={currentConfig}
      />

      <LoadTemplateDialog
        visible={showLoadDialog}
        onClose={() => setShowLoadDialog(false)}
        onLoad={handleLoadFromFile}
      />
    </TemplateContainer>
  );
}; 