import React, { useState } from 'react';
import { ModelConfig } from '../../types/config';
import { ModelConfigForm } from '../ModelConfigForm';
import { useModelManagement } from '../../hooks/useModelManagement';
import './styles.css';

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
    <div className="model-list">
      <div className="list-header">
        <h2>模型配置</h2>
        <button
          className="btn-primary"
          onClick={() => setIsAddingModel(true)}
        >
          添加模型
        </button>
      </div>

      {models.length === 0 ? (
        <div className="empty-state">
          <p>暂无模型配置</p>
          <button
            className="btn-primary"
            onClick={() => setIsAddingModel(true)}
          >
            添加第一个模型
          </button>
        </div>
      ) : (
        <div className="model-grid">
          {models.map(renderModelCard)}
        </div>
      )}

      {(isAddingModel || editingModel) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ModelConfigForm
              initialData={editingModel || undefined}
              onSubmit={editingModel ? handleUpdateModel : handleAddModel}
              onCancel={() => {
                setIsAddingModel(false);
                setEditingModel(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelList; 