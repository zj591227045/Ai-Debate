import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Tooltip, Upload } from 'antd';
import { EditOutlined, DeleteOutlined, ExportOutlined, ImportOutlined, UploadOutlined } from '@ant-design/icons';
import { StateManager } from '../../../../store/unified';
import { CharacterTemplate, characterTemplateSchema } from '../../types/template';
import type { UploadProps } from 'antd';
import type { RcFile } from 'antd/es/upload';
import type { UnifiedState } from '../../../../store/unified';
import './styles.css';

export function TemplateManager() {
  const stateManager = StateManager.getInstance();
  const characters = stateManager.getState().characters;
  const [templates, setTemplates] = useState(() => 
    (characters.templates ? Object.values(characters.templates.byId) : []).map(template => ({
      ...template,
      createdAt: template.createdAt || Date.now(),
      updatedAt: template.updatedAt || Date.now(),
      description: template.description || '',
      isTemplate: true
    })) as CharacterTemplate[]
  );

  useEffect(() => {
    const unsubscribe = stateManager.subscribe((newState) => {
      setTemplates(
        (newState.characters.templates 
          ? Object.values(newState.characters.templates.byId)
          : []).map(template => ({
            ...template,
            createdAt: template.createdAt || Date.now(),
            updatedAt: template.updatedAt || Date.now(),
            description: template.description || '',
            isTemplate: true
          })) as CharacterTemplate[]
      );
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteTemplate = (id: string) => {
    Modal.confirm({
      title: '确认删除模板',
      content: '删除后将无法恢复',
      okText: '确定删除',
      cancelText: '取消',
      onOk: () => {
        stateManager.dispatch({
          type: 'TEMPLATE_DELETED',
          payload: { id }
        });
        message.success('模板已删除');
      }
    });
  };

  const handleExportTemplate = (template: CharacterTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${template.name}-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportTemplate: UploadProps['beforeUpload'] = (file: RcFile) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const templateData = JSON.parse(content);
        
        // 使用 Zod 验证导入的数据
        const validationResult = characterTemplateSchema.safeParse(templateData);
        
        if (!validationResult.success) {
          message.error('模板格式不正确，请检查文件内容');
          return false;
        }

        // 生成新的ID和时间戳
        const template: CharacterTemplate = {
          ...validationResult.data,
          id: `template_${Date.now()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        stateManager.dispatch({
          type: 'TEMPLATE_ADDED',
          payload: template
        });
        message.success('模板导入成功');
      } catch (error) {
        message.error('导入失败，请检查文件格式');
      }
    };

    reader.readAsText(file);
    return false; // 阻止自动上传
  };

  const columns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: {
        showTitle: false,
      },
      render: (description: string) => (
        <Tooltip placement="topLeft" title={description}>
          {description}
        </Tooltip>
      ),
    },
    {
      title: '专业背景',
      dataIndex: ['persona', 'background'],
      key: 'background',
    },
    {
      title: '说话风格',
      dataIndex: ['persona', 'speakingStyle'],
      key: 'speakingStyle',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (timestamp: number) => new Date(timestamp).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: CharacterTemplate) => (
        <div className="template-actions">
          <Button
            icon={<ExportOutlined />}
            onClick={() => handleExportTemplate(record)}
            title="导出模板"
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTemplate(record.id)}
            title="删除模板"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="template-manager">
      <div className="template-manager-header">
        <h2>模板管理</h2>
        <div className="template-actions-group">
          <Upload
            accept=".json"
            showUploadList={false}
            beforeUpload={handleImportTemplate}
          >
            <Button icon={<ImportOutlined />}>导入模板</Button>
          </Upload>
          <div className="template-stats">
            共 {templates.length} 个模板
          </div>
        </div>
      </div>
      
      <Table
        dataSource={templates}
        columns={columns}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </div>
  );
} 