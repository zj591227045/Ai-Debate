import React, { useState, useRef } from 'react';
import { useModel } from '../../context/ModelContext';
import ModelForm from '../ModelForm';
import { exportModelConfigs, importModelConfigs, testModelConfig, ValidationResult } from '../../utils/modelValidation';
import './styles.css';

interface TestStatus {
  [key: string]: {
    testing: boolean;
    result?: ValidationResult;
  };
}

export default function ModelList() {
  const { state, dispatch } = useModel();
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

  const handleDeleteModel = (id: string) => {
    if (window.confirm('确定要删除这个模型配置吗？')) {
      dispatch({ type: 'DELETE_MODEL', payload: id });
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingModel(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingModel(null);
  };

  const handleExport = () => {
    const jsonStr = exportModelConfigs(state.models);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model-configs.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { configs, validationResults } = importModelConfigs(e.target?.result as string);
        
        // 检查是否有无效的配置
        let hasInvalidConfig = false;
        validationResults.forEach((result) => {
          if (!result.isValid) {
            hasInvalidConfig = true;
          }
        });

        if (hasInvalidConfig) {
          const confirmImport = window.confirm(
            '部分配置验证未通过，是否仍要导入？\n' +
            Array.from(validationResults.entries())
              .filter(([_, result]) => !result.isValid)
              .map(([name, result]) => `${name}: ${result.errors.join(', ')}`)
              .join('\n')
          );
          if (!confirmImport) return;
        }

        // 导入配置
        configs.forEach(config => {
          dispatch({ type: 'ADD_MODEL', payload: config });
        });

        alert('导入成功！');
      } catch (error) {
        alert('导入失败：' + (error as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const handleTestModel = async (id: string) => {
    const model = state.models.find(m => m.id === id);
    if (!model) return;

    setTestStatus(prev => ({
      ...prev,
      [id]: { testing: true }
    }));

    try {
      const result = await testModelConfig(model);
      setTestStatus(prev => ({
        ...prev,
        [id]: { testing: false, result }
      }));

      if (!result.isValid) {
        alert(`测试失败：\n${result.errors.join('\n')}`);
      } else {
        alert('测试成功！');
      }
    } catch (error) {
      setTestStatus(prev => ({
        ...prev,
        [id]: {
          testing: false,
          result: { isValid: false, errors: [(error as Error).message] }
        }
      }));
      alert('测试失败：' + (error as Error).message);
    }
  };

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

      {showForm && (
        <div className="model-form-modal">
          <div className="model-form-modal-content">
            <ModelForm
              model={
                editingModel
                  ? state.models.find((m) => m.id === editingModel)
                  : undefined
              }
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}

      <div className="model-grid">
        {state.models.map((model) => {
          const provider = state.providers.find(p => p.id === model.provider);
          const status = testStatus[model.id];
          
          return (
            <div key={model.id} className="model-config-card">
              <div className="model-config-header">
                <h3>{model.name}</h3>
                <span className="provider-tag">{provider?.name}</span>
              </div>

              <div className="model-config-info">
                <div className="model-config-detail">
                  <span className="label">模型:</span>
                  <span className="value">{model.model}</span>
                </div>
                <div className="model-config-detail">
                  <span className="label">Temperature:</span>
                  <span className="value">{model.parameters.temperature}</span>
                </div>
                <div className="model-config-detail">
                  <span className="label">Top P:</span>
                  <span className="value">{model.parameters.topP}</span>
                </div>
                <div className="model-config-detail">
                  <span className="label">Max Tokens:</span>
                  <span className="value">{model.parameters.maxTokens}</span>
                </div>
              </div>

              <div className="model-config-actions">
                <button
                  className="btn-secondary"
                  onClick={() => handleTestModel(model.id)}
                  disabled={status?.testing}
                >
                  {status?.testing ? '测试中...' : '测试连接'}
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
          );
        })}

        {state.models.length === 0 && (
          <div className="empty-state">
            <p>暂无模型配置，点击"添加模型配置"创建新配置</p>
          </div>
        )}
      </div>
    </div>
  );
} 