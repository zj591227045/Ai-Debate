import React, { useState } from 'react';
import { ModelConfig } from '../../types/config';
import { ModelConfigForm } from '../ModelConfigForm';
import { useModelManagement } from '../../hooks/useModelManagement';
import './styles.css';
import { Button, message, Tooltip, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';

// 基础容器
const GlassContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(167,187,255,0.2);
  padding: 2rem;
  box-shadow: 
    0 8px 32px 0 rgba(31, 38, 135, 0.37),
    inset 0 0 30px rgba(167,187,255,0.1);
  width: 100%;
  min-height: calc(100vh - 4rem);
  box-sizing: border-box;
`;

// 头部样式
const ListHeader = styled.div`
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

// 模型网格容器
const ModelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1.5rem;
  width: 100%;
`;

// 模型卡片
const ModelCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(167,187,255,0.2);
  padding: 1.5rem;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  }
`;

const ModelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const ModelName = styled.h3`
  color: #E8F0FF;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 0 10px rgba(167,187,255,0.3);
`;

const ModelProvider = styled.span`
  font-size: 0.9rem;
  color: rgba(232,240,255,0.7);
  background: rgba(167,187,255,0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  border: 1px solid rgba(167,187,255,0.2);
`;

const ModelInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: rgba(232,240,255,0.9);
  font-size: 0.9rem;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(167,187,255,0.05);
  border-radius: 8px;
  border: 1px solid rgba(167,187,255,0.1);

  span:first-of-type {
    color: rgba(232,240,255,0.7);
  }

  span:last-of-type {
    color: #E8F0FF;
    font-weight: 500;
  }
`;

const ModelStatus = styled.div<{ $inUse?: boolean }>`
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  
  ${props => props.$inUse ? `
    background: rgba(65, 87, 255, 0.1);
    color: #4157ff;
    border: 1px solid rgba(65, 87, 255, 0.2);
  ` : `
    background: rgba(167,187,255,0.1);
    color: rgba(232,240,255,0.7);
    border: 1px solid rgba(167,187,255,0.2);
  `}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: auto;
`;

const ActionButton = styled(Button)`
  flex: 1;
  height: 36px;
  background: rgba(167,187,255,0.1);
  border: 1px solid rgba(167,187,255,0.2);
  color: rgba(232,240,255,0.9);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: rgba(167,187,255,0.2);
    border-color: rgba(167,187,255,0.3);
    color: #E8F0FF;
    transform: translateY(-1px);
  }

  &.delete {
    &:hover {
      background: rgba(255, 65, 87, 0.2);
      border-color: rgba(255, 65, 87, 0.3);
      color: #ff4157;
    }
  }
`;

const AddButton = styled(Button)`
  background: linear-gradient(45deg, rgba(9,9,121,0.9), rgba(0,57,89,0.9));
  border: 1px solid rgba(167,187,255,0.3);
  color: #E8F0FF;
  height: 40px;
  padding: 0 1.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(31, 38, 135, 0.3);
    border-color: rgba(167,187,255,0.4);
    color: #E8F0FF;
  }

  .anticon {
    font-size: 1.1rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(232,240,255,0.7);
  background: rgba(167,187,255,0.05);
  border-radius: 12px;
  border: 1px dashed rgba(167,187,255,0.2);
  grid-column: 1 / -1;

  p {
    margin: 1rem 0;
    font-size: 1rem;
    line-height: 1.6;
  }
`;

const FormModal = styled(Modal)`
  .ant-modal-content {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(167,187,255,0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .ant-modal-header {
    background: transparent;
    border-bottom: 1px solid rgba(167,187,255,0.1);
    padding: 1.5rem;
  }

  .ant-modal-title {
    color: #E8F0FF;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .ant-modal-close {
    color: rgba(232,240,255,0.7);
    
    &:hover {
      color: #E8F0FF;
    }
  }

  .ant-modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    max-height: calc(90vh - 150px);

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(167,187,255,0.05);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(167,187,255,0.2);
      border-radius: 3px;
      
      &:hover {
        background: rgba(167,187,255,0.3);
      }
    }
  }

  .ant-modal-footer {
    border-top: 1px solid rgba(167,187,255,0.1);
    padding: 1rem 1.5rem;
    margin-top: 0;

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

export const ModelList: React.FC = () => {
  const { 
    models, 
    loading,
    error,
    addModel,
    updateModel,
    deleteModel,
    toggleModelStatus
  } = useModelManagement();

  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleAddModel = async (config: ModelConfig) => {
    try {
      await addModel(config);
      setIsAddingModel(false);
      } catch (err) {
      console.error('添加模型失败:', err);
    }
  };

  const handleUpdateModel = async (config: ModelConfig) => {
    try {
      await updateModel(config.id, config);
      setEditingModel(null);
    } catch (err) {
      console.error('更新模型失败:', err);
    }
  };

  const handleDeleteModel = async (id: string) => {
    try {
      await deleteModel(id);
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('删除模型失败:', err);
    }
  };

  const renderModelCard = (model: ModelConfig) => (
    <div key={model.id} className="model-card">
      <div className="model-info">
        <div className="model-header">
          <h3>{model.name}</h3>
          <div className="model-status">
            <span className={`status-badge ${model.isEnabled ? 'enabled' : 'disabled'}`}>
              {model.isEnabled ? '已启用' : '已禁用'}
            </span>
          </div>
        </div>
        
        <div className="model-details">
          <p><strong>供应商：</strong>{model.provider}</p>
          <p><strong>模型：</strong>{model.model}</p>
          <p><strong>服务地址：</strong>{model.auth.baseUrl}</p>
        </div>

        <div className="model-parameters">
          <p><strong>参数配置：</strong></p>
          <ul>
            <li>温度：{model.parameters.temperature}</li>
            <li>最大Token数：{model.parameters.maxTokens}</li>
            <li>Top P：{model.parameters.topP}</li>
          </ul>
        </div>
      </div>

      <div className="model-actions">
                <button
                  className="btn-secondary"
          onClick={() => setEditingModel(model)}
                >
          编辑
                </button>
                <button
                  className="btn-secondary"
          onClick={() => toggleModelStatus(model.id, !model.isEnabled)}
                >
          {model.isEnabled ? '禁用' : '启用'}
                </button>
                <button
          className="btn-danger"
          onClick={() => setShowDeleteConfirm(model.id)}
                >
          删除
                </button>
      </div>

      {showDeleteConfirm === model.id && (
        <div className="delete-confirm">
          <p>确定要删除此模型配置吗？</p>
          <div className="confirm-actions">
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteModel(model.id)}
                >
              确定
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowDeleteConfirm(null)}
            >
              取消
                </button>
              </div>
            </div>
      )}
    </div>
  );

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return <div className="error">加载失败: {error.message}</div>;
  }

  return (
    <GlassContainer>
      <ListHeader>
        <Title>模型管理</Title>
        <AddButton onClick={() => setIsAddingModel(true)} icon={<PlusOutlined />}>
          添加模型
        </AddButton>
      </ListHeader>

      <ModelGrid>
        {models.length > 0 ? (
          models.map(model => (
            <ModelCard key={model.id}>
              <ModelStatus $inUse={model.isEnabled}>
              </ModelStatus>
              
              <ModelHeader>
                <ModelName>{model.name}</ModelName>
                <ModelProvider>{model.provider}</ModelProvider>
              </ModelHeader>

              <ModelInfo>
                <InfoItem>
                  <span>模型</span>
                  <span>{model.model}</span>
                </InfoItem>
                <InfoItem>
                  <span>服务地址</span>
                  <span>{model.auth?.baseUrl || '默认地址'}</span>
                </InfoItem>
                <InfoItem>
                  <span>温度</span>
                  <span>{model.parameters?.temperature || 0.7}</span>
                </InfoItem>
                <InfoItem>
                  <span>最大Token数</span>
                  <span>{model.parameters?.maxTokens || 2048}</span>
                </InfoItem>
                <InfoItem>
                  <span>Top P</span>
                  <span>{model.parameters?.topP || 0.9}</span>
                </InfoItem>
              </ModelInfo>

              <ActionButtons>
                <Tooltip title="编辑模型">
                  <ActionButton 
                    icon={<EditOutlined />}
                    onClick={() => setEditingModel(model)}
                  >
                    编辑
                  </ActionButton>
                </Tooltip>
                <Tooltip title="删除模型">
                  <ActionButton
                    className="delete"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteModel(model.id)}
                  >
                    删除
                  </ActionButton>
                </Tooltip>
              </ActionButtons>
            </ModelCard>
          ))
        ) : (
          <EmptyState>
            <p>暂无模型配置，点击"添加模型"创建新的模型配置</p>
          </EmptyState>
        )}
      </ModelGrid>

      {(isAddingModel || editingModel) && (
        <FormModal
          title={editingModel ? '编辑模型' : '添加模型'}
          open={true}
          onCancel={() => {
            setIsAddingModel(false);
            setEditingModel(null);
          }}
          footer={null}
          width={600}
          centered
          destroyOnClose
        >
          <ModelConfigForm
            initialData={editingModel || undefined}
            onSubmit={editingModel ? handleUpdateModel : handleAddModel}
            onCancel={() => {
              setIsAddingModel(false);
              setEditingModel(null);
            }}
          />
        </FormModal>
      )}
    </GlassContainer>
  );
};

export default ModelList; 