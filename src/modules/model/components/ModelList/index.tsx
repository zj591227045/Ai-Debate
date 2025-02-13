import React, { useState, useRef } from 'react';
import { useModel } from '../../context/ModelContext';
import ModelForm from '../ModelForm';
import { ModelConfig } from '../../types';
import { UnifiedLLMService } from '../../../llm/services/UnifiedLLMService';
import { adaptModelConfig } from '../../../llm/utils/adapters';
import { message } from 'antd';
import './styles.css';

interface TestStatus {
  [key: string]: {
    testing: boolean;
    success?: boolean;
    error?: string;
  };
}

export default function ModelList() {
  console.log('ModelList组件渲染');
  const { 
    models, 
    isLoading, 
    error,
    addModel,
    updateModel,
    deleteModel,
    toggleModel,
    importConfigs,
    exportConfigs 
  } = useModel();
  
  console.log('ModelList获取到的models:', models);
  console.log('ModelList loading状态:', isLoading);
  console.log('ModelList error状态:', error);

  const [showForm, setShowForm] = useState(false);
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<TestStatus>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddModel = () => {
    setEditingModel(null);
    setShowForm(true);
  };

  const handleEditModel = (id: string) => {
    setEditingModel(id);
    setShowForm(true);
  };

  const handleDeleteModel = async (id: string) => {
    if (window.confirm('确定要删除这个模型配置吗？')) {
      try {
        await deleteModel(id);
        message.success('删除成功');
      } catch (err) {
        message.error('删除失败');
      }
    }
  };

  const handleFormSubmit = async (values: Omit<ModelConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingModel) {
        await updateModel(editingModel, values);
        message.success('更新成功');
      } else {
        await addModel(values);
        message.success('添加成功');
      }
      setShowForm(false);
      setEditingModel(null);
    } catch (err) {
      message.error(editingModel ? '更新失败' : '添加失败');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingModel(null);
  };

  const handleExport = async () => {
    try {
      const configs = await exportConfigs();
      const jsonStr = JSON.stringify(configs, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'model-configs.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (err) {
      message.error('导出失败');
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const configs = JSON.parse(text);
      await importConfigs(configs);
      message.success('导入成功');
    } catch (err) {
      message.error('导入失败');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTestModel = async (model: ModelConfig) => {
    setTestStatus(prev => ({
      ...prev,
      [model.id]: { testing: true }
    }));

    try {
      const llmService = UnifiedLLMService.getInstance();
      const llmConfig = adaptModelConfig(model);
      await llmService.testConnection(llmConfig);
      
      setTestStatus(prev => ({
        ...prev,
        [model.id]: { testing: false, success: true }
      }));
      message.success('连接测试成功');
    } catch (err) {
      setTestStatus(prev => ({
        ...prev,
        [model.id]: { 
          testing: false, 
          success: false, 
          error: err instanceof Error ? err.message : '未知错误' 
        }
      }));
      message.error('连接测试失败');
    }
  };

  const handleToggleModel = async (id: string, isEnabled: boolean) => {
    try {
      await toggleModel(id, isEnabled);
      message.success(isEnabled ? '模型已启用' : '模型已禁用');
    } catch (err) {
      message.error('操作失败');
    }
  };

  if (error) {
    return <div className="error-message">加载失败: {error}</div>;
  }

  return (
    <div className="model-list-container">
      <div className="model-list-header">
        <h2>模型配置管理</h2>
        <div className="model-list-actions">
          <button className="btn-secondary" onClick={handleImport}>
            导入配置
          </button>
          <button className="btn-secondary" onClick={handleExport}>
            导出配置
          </button>
          <button className="btn-primary" onClick={handleAddModel}>
            添加模型配置
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleFileChange}
      />

      {isLoading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="model-grid">
          {models.map(model => (
            <div key={model.id} className="model-config-card">
              <div className="model-config-header">
                <h3>{model.name}</h3>
                <span className="provider-tag">{model.provider}</span>
              </div>
              <div className="model-config-info">
                <div className="model-config-detail">
                  <span className="label">模型</span>
                  <span className="value">{model.model}</span>
                </div>
                <div className="model-config-detail">
                  <span className="label">状态</span>
                  <span className="value">{model.isEnabled ? '已启用' : '已禁用'}</span>
                </div>
              </div>
              <div className="model-config-actions">
                <button
                  className="btn-secondary"
                  onClick={() => handleToggleModel(model.id, !model.isEnabled)}
                >
                  {model.isEnabled ? '禁用' : '启用'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => handleTestModel(model)}
                  disabled={testStatus[model.id]?.testing}
                >
                  {testStatus[model.id]?.testing ? '测试中...' : '测试连接'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => handleEditModel(model.id)}
                >
                  编辑
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteModel(model.id)}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="model-form-modal">
          <div className="model-form-modal-content">
            <ModelForm
              initialValues={
                editingModel
                  ? models.find((m) => m.id === editingModel)
                  : undefined
              }
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
} 