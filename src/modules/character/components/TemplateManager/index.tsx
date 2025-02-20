import React from 'react';
import { Table, Button, Modal, message, Tooltip, Upload } from 'antd';
import { EditOutlined, DeleteOutlined, ExportOutlined, ImportOutlined } from '@ant-design/icons';
import { useCharacter } from '../../context/CharacterContext';
import { CharacterTemplate, characterTemplateSchema } from '../../types/template';
import type { UploadProps } from 'antd';
import type { RcFile } from 'antd/es/upload';
import type { ColumnsType } from 'antd/es/table';
import styled from '@emotion/styled';

const TemplateContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(167,187,255,0.2);
  padding: 2rem;
  box-shadow: 
    0 8px 32px 0 rgba(31, 38, 135, 0.37),
    inset 0 0 30px rgba(167,187,255,0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  color: #E8F0FF;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 
    0 0 10px rgba(167,187,255,0.5),
    0 0 20px rgba(167,187,255,0.3);
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StyledButton = styled(Button)`
  background: linear-gradient(45deg, rgba(9,9,121,0.9), rgba(0,57,89,0.9));
  border: 1px solid rgba(167,187,255,0.3);
  color: #E8F0FF;
  height: 40px;
  padding: 0 1.5rem;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(31, 38, 135, 0.3);
    border-color: rgba(167,187,255,0.4);
    color: #E8F0FF;
  }

  &.ant-btn-dangerous {
    background: linear-gradient(45deg, rgba(255,65,87,0.9), rgba(255,87,65,0.9));
  }
`;

const TemplateStats = styled.div`
  color: rgba(232,240,255,0.7);
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  background: rgba(167,187,255,0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StyledTable = styled(Table<CharacterTemplate>)`
  .ant-table {
    background: transparent;
    border-radius: 12px;
    overflow: hidden;
  }

  .ant-table-thead > tr > th {
    background: rgba(167,187,255,0.1);
    color: #E8F0FF;
    border-bottom: 1px solid rgba(167,187,255,0.2);
    
    &::before {
      display: none;
    }
  }

  .ant-table-tbody > tr > td {
    border-bottom: 1px solid rgba(167,187,255,0.1);
    color: rgba(232,240,255,0.9);
    transition: all 0.3s ease;
  }

  .ant-table-tbody > tr:hover > td {
    background: rgba(167,187,255,0.05) !important;
  }

  .ant-table-row {
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(31, 38, 135, 0.2);
    }
  }

  .ant-pagination {
    .ant-pagination-item {
      background: rgba(167,187,255,0.1);
      border-color: rgba(167,187,255,0.2);
      
      a {
        color: rgba(232,240,255,0.9);
      }

      &:hover {
        border-color: rgba(167,187,255,0.4);
        
        a {
          color: #E8F0FF;
        }
      }

      &-active {
        background: linear-gradient(45deg, rgba(9,9,121,0.9), rgba(0,57,89,0.9));
        border-color: rgba(167,187,255,0.3);
        
        a {
          color: #E8F0FF;
        }
      }
    }

    .ant-pagination-prev,
    .ant-pagination-next {
      button {
        background: rgba(167,187,255,0.1);
        border-color: rgba(167,187,255,0.2);
        color: rgba(232,240,255,0.9);

        &:hover {
          border-color: rgba(167,187,255,0.4);
          color: #E8F0FF;
        }
      }
    }
  }
`;

const TemplateCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TemplateName = styled.span`
  font-weight: 500;
  color: #E8F0FF;
`;

const TemplateDescription = styled.span`
  color: rgba(232,240,255,0.7);
  font-size: 0.9rem;
`;

export const TemplateManager: React.FC = () => {
  const { state, dispatch } = useCharacter();

  const handleDeleteTemplate = (id: string) => {
    Modal.confirm({
      title: '确定要删除这个模板吗？',
      content: '删除后将无法恢复',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        dispatch({ type: 'DELETE_TEMPLATE', payload: id });
        message.success('模板已删除');
      },
      wrapClassName: 'custom-modal',
      centered: true,
      okButtonProps: { 
        danger: true,
        style: {
          background: 'linear-gradient(45deg, rgba(255,65,87,0.9), rgba(255,87,65,0.9))'
        }
      },
      cancelButtonProps: {
        style: {
          background: 'rgba(167,187,255,0.1)',
          borderColor: 'rgba(167,187,255,0.2)',
          color: 'rgba(232,240,255,0.9)'
        }
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
        
        const validationResult = characterTemplateSchema.safeParse(templateData);
        
        if (!validationResult.success) {
          message.error('模板格式不正确，请检查文件内容');
          return false;
        }

        const template: CharacterTemplate = {
          ...validationResult.data,
          id: `template_${Date.now()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        dispatch({ type: 'ADD_TEMPLATE', payload: template });
        message.success('模板导入成功');
      } catch (error) {
        message.error('导入失败，请检查文件格式');
      }
    };

    reader.readAsText(file);
    return false;
  };

  const columns: ColumnsType<CharacterTemplate> = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <TemplateCell>
          <TemplateName>{name}</TemplateName>
        </TemplateCell>
      ),
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
          <TemplateDescription>{description}</TemplateDescription>
        </Tooltip>
      ),
    },
    {
      title: '专业背景',
      dataIndex: ['persona', 'background'],
      key: 'background',
      render: (background: string) => (
        <TemplateDescription>{background}</TemplateDescription>
      ),
    },
    {
      title: '说话风格',
      dataIndex: ['persona', 'speakingStyle'],
      key: 'speakingStyle',
      render: (style: string) => (
        <TemplateDescription>{style}</TemplateDescription>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (timestamp: number) => (
        <TemplateDescription>
          {new Date(timestamp).toLocaleString()}
        </TemplateDescription>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: CharacterTemplate) => (
        <ActionGroup>
          <StyledButton
            icon={<ExportOutlined />}
            onClick={() => handleExportTemplate(record)}
            title="导出模板"
          >
            导出
          </StyledButton>
          <StyledButton
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTemplate(record.id)}
            title="删除模板"
          >
            删除
          </StyledButton>
        </ActionGroup>
      ),
    },
  ];

  return (
    <TemplateContainer>
      <Header>
        <Title>模板管理</Title>
        <ActionGroup>
          <Upload
            accept=".json"
            showUploadList={false}
            beforeUpload={handleImportTemplate}
          >
            <StyledButton icon={<ImportOutlined />}>
              导入模板
            </StyledButton>
          </Upload>
          <TemplateStats>
            共 {state.templates.length} 个模板
          </TemplateStats>
        </ActionGroup>
      </Header>
      
      <StyledTable
        dataSource={state.templates}
        columns={columns}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </TemplateContainer>
  );
}; 