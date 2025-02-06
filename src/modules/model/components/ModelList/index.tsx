import React, { useState, useRef } from 'react';
import { useModel } from '../../context/ModelContext';
import ModelForm from '../ModelForm';
import { exportModelConfigs, importModelConfigs } from '../../utils/modelValidation';
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

    console.group('=== 模型连接测试 ===');
    console.log('测试模型配置:', model);

    setTestStatus(prev => ({
      ...prev,
      [id]: { testing: true }
    }));

    try {
      console.log('创建 UnifiedLLMService 实例...');
      const llmService = new UnifiedLLMService();
      
      console.log('适配模型配置...');
      const adaptedConfig = adaptModelConfig(model);
      console.log('适配后的配置:', adaptedConfig);
      
      console.log('获取并初始化供应商实例...');
      const provider = await llmService.getInitializedProvider(adaptedConfig);
      console.log('供应商实例初始化成功:', provider.getProviderName?.() || adaptedConfig.provider);
      
      console.log('验证供应商配置...');
      await provider.validateConfig();
      console.log('配置验证成功');
      
      setTestStatus(prev => ({
        ...prev,
        [id]: { testing: false, success: true }
      }));
      message.success('连接测试成功！');
    } catch (error) {
      console.error('测试失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('错误详情:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      setTestStatus(prev => ({
        ...prev,
        [id]: { testing: false, success: false, error: errorMessage }
      }));
      message.error(`连接测试失败: ${errorMessage}`);
    } finally {
      console.groupEnd();
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
              initialValues={
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
          const providerName = model.provider === 'ollama' ? 'Ollama' : 
                             model.provider === 'deepseek' ? 'DeepSeek' : 
                             model.provider;
          const status = testStatus[model.id];
          
          return (
            <div key={model.id} className="model-card">
              <div className="model-card-header">
                <h3>{model.name}</h3>
                <span className="provider-tag">{providerName}</span>
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
                  className={`btn-secondary ${status?.success ? 'success' : status?.error ? 'error' : ''}`}
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
              {status?.error && (
                <div className="error-message">
                  {status.error}
                </div>
              )}
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