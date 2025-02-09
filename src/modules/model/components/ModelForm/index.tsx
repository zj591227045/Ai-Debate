import React, { useState, useEffect } from 'react';
import { ModelConfig, PartialModelConfig, DEFAULT_PARAMETER_RANGES, AuthConfig, ModelProvider } from '../../types';
import { useModel } from '../../context/ModelContext';
import { testModelConfig } from '../../utils/modelValidation';
import ModelTestDialog from '../ModelTestDialog';
import { v4 as uuidv4 } from 'uuid';
import './styles.css';
import type { LLMProvider } from '../../../llm/services/provider/base';
import { ProviderFactory } from '../../../llm/services/provider/factory';
import { OllamaConfigForm } from '../providers/OllamaConfigForm';
import { OllamaConfigFactory } from '../../factories/OllamaConfigFactory';
import { DeepseekConfigForm } from '../providers/DeepseekConfigForm';
import { DeepseekConfigFactory } from '../../factories/DeepseekConfigFactory';
import { UnifiedLLMService } from '../../../llm/services/UnifiedLLMService';
import { adaptModelConfig } from '../../../llm/utils/adapters';
import { ModelConfig as LLMModelConfig } from '@/modules/llm/types';
import { message } from 'antd';
import { Form, Input, FormInstance, Button, Select, Slider, Space, Spin } from 'antd';
import { ProviderSelect } from '../providers/ProviderSelect';
import { SiliconFlowConfigForm } from '../providers/SiliconFlowConfigForm';
import { ModelParameters } from '../../types';
import { DEFAULT_PROVIDERS } from '../../types';

interface ModelFormProps {
  initialValues?: ModelConfig;
  onSubmit: (values: ModelConfig) => void;
  onCancel?: () => void;
}

interface ProviderConfigProps {
  form: FormInstance;
  formData: ModelConfig;
  onChange: (values: Partial<ModelConfig>) => void;
}

interface OllamaConfigFormProps {
  formData: ModelConfig;
  onChange: (values: Partial<ModelConfig>) => void;
}

interface DeepseekConfigFormProps {
  formData: ModelConfig;
  onChange: (values: Partial<ModelConfig>) => void;
}

const defaultParameters = {
  temperature: DEFAULT_PARAMETER_RANGES.temperature.default,
  topP: DEFAULT_PARAMETER_RANGES.topP.default,
  maxTokens: DEFAULT_PARAMETER_RANGES.maxTokens.default,
};

const createInitialState = (model?: ModelConfig): PartialModelConfig => ({
  provider: model?.provider || DEFAULT_PROVIDERS[0].id,
  parameters: {
    temperature: model?.parameters?.temperature || 0.7,
    maxTokens: model?.parameters?.maxTokens || 2000,
    topP: model?.parameters?.topP || 0.9
  },
  auth: {
    baseUrl: model?.auth?.baseUrl || '',
    apiKey: model?.auth?.apiKey || '',
    organizationId: model?.auth?.organizationId || ''
  },
  isEnabled: model?.isEnabled ?? true
});

export const ModelForm: React.FC<ModelFormProps> = ({ initialValues, onSubmit, onCancel }) => {
  const { dispatch } = useModel();
  const [form] = Form.useForm();
  const [provider, setProvider] = useState<string>(initialValues?.provider || '');
  const initialState = initialValues || {
    name: '',
    provider: 'ollama',
    model: '',
    parameters: {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2000
    },
    auth: {
      baseUrl: 'http://localhost:11434',
      apiKey: '',
      organizationId: ''
    }
  };

  const [formData, setFormData] = useState<ModelConfig>({
    id: initialValues?.id || '',
    name: initialValues?.name || '',
    provider: initialValues?.provider || 'ollama',
    model: initialValues?.model || '',
    parameters: initialValues?.parameters || {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2000
    },
    auth: initialValues?.auth || {
      apiKey: '',
      organizationId: '',
      baseUrl: 'http://localhost:11434'
    },
    isEnabled: initialValues?.isEnabled ?? true,
    createdAt: initialValues?.createdAt || Date.now(),
    updatedAt: initialValues?.updatedAt || Date.now()
  });
  const [isTesting, setIsTesting] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showChatTestDialog, setShowChatTestDialog] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const llmService = UnifiedLLMService.getInstance();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTestConfig, setCurrentTestConfig] = useState<ModelConfig | null>(null);

  const handleProviderChange = async (value: string) => {
    console.log('Provider changing to:', value);
    
    // 验证供应商是否支持
    if (!ProviderFactory.isProviderSupported(value)) {
      message.error(`不支持的供应商: ${value}`);
      return;
    }

    const defaultBaseUrl = DEFAULT_PROVIDERS.find(p => p.id === value)?.defaultBaseUrl || '';
    
    // 更新 formData
    setFormData(prev => ({
      ...prev,
      provider: value,
      model: '',
      auth: {
        ...prev.auth,
        baseUrl: defaultBaseUrl
      }
    }));
    
    // 更新表单字段
    form.setFieldsValue({
      provider: value,
      model: undefined,
      auth: {
        baseUrl: defaultBaseUrl
      }
    });

    // 等待表单更新完成后刷新模型列表
    setTimeout(refreshModelList, 0);
  };

  const refreshModelList = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      const tempConfig = {
        id: 'temp',
        name: 'temp',
        provider: form.getFieldValue('provider'),
        model: '',
        parameters: {
          temperature: 0.7,
          topP: 0.9,
          maxTokens: 2000
        },
        auth: {
          baseUrl: form.getFieldValue(['auth', 'baseUrl'])
        },
        isEnabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const provider = await llmService.getInitializedProvider(tempConfig, true);
      const models = await provider.listModels();
      
      setAvailableModels(models);

      // 如果当前选中的模型不在新的模型列表中，清空选择
      if (!models.includes(formData.model)) {
        handleModelChange('');
      }

      message.success('模型列表已更新');
    } catch (error) {
      console.error('\n 获取模型列表失败:', error);
      setError(error instanceof Error ? error.message : '获取模型列表失败');
      message.error('获取模型列表失败');
    } finally {
      setRefreshing(false);
    }
  };

  // 当 provider 改变时刷新模型列表
  useEffect(() => {
    if (formData.provider && formData.auth?.baseUrl) {
      console.log('Provider changed, refreshing models list');
      refreshModelList();
    }
  }, [formData.provider]);

  const handleInputChange = (field: keyof ModelConfig, value: any) => {
    setFormData((prev: ModelConfig) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAuthChange = (field: keyof AuthConfig, value: string) => {
    setFormData((prev: ModelConfig) => ({
      ...prev,
      auth: {
        ...prev.auth,
        [field]: value,
      },
    }));
  };

  const handleBaseUrlChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      auth: {
        ...prev.auth,
        baseUrl: value
      }
    }));
  };

  const handleModelChange = (value: string) => {
    // 同时更新 formData 和表单值
    setFormData(prev => ({
      ...prev,
      model: value
    }));
    
    form.setFieldsValue({
      model: value
    });

    // 触发表单验证
    form.validateFields(['model']);
  };

  const handleParameterChange = (parameter: keyof ModelParameters) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setFormData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [parameter]: value
      }
    }));
  };

  const handleApiKeyChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      auth: {
        ...prev.auth,
        apiKey: value
      }
    }));
  };

  const getAvailableModels = () => {
    if (formData.provider === 'ollama') {
      return availableModels;
    }
    return ['model1', 'model2']; // Assuming default models
  };

  const handleTestConnection = async () => {
    try {
      const config = adaptModelConfig({
        ...formData,
        id: formData.id || uuidv4(),
        name: formData.name || '未命名配置',
        isEnabled: true,
        createdAt: formData.createdAt || Date.now(),
        updatedAt: Date.now(),
      });

      const provider = await llmService.getInitializedProvider(config);
      await provider.validateConfig();
      
      message.success('连接测试成功！');
    } catch (error) {
      console.error('连接测试失败:', error);
      message.error('连接测试失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleChatTest = () => {
    const config: ModelConfig = {
      id: formData.id || uuidv4(),
      name: formData.name,
      provider: formData.provider,
      model: formData.model,
      parameters: formData.parameters,
      auth: formData.auth,
      isEnabled: formData.isEnabled,
      createdAt: formData.createdAt,
      updatedAt: formData.updatedAt
    };
    setCurrentTestConfig(config);
    setShowTestDialog(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // 合并表单值和 formData
      const mergedConfig = {
        ...formData,
        ...values,
        id: formData.id || uuidv4(),
        createdAt: formData.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      // 适配配置
      const config = adaptModelConfig(mergedConfig);

      // 验证配置
      const provider = await llmService.getInitializedProvider(config);
      await provider.validateConfig();
      
      // 提交配置
      onSubmit(config);
      message.success('配置保存成功');
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const renderProviderConfig = () => {
    const provider = formData.provider;
    if (!provider) return null;

    const providerConfig = DEFAULT_PROVIDERS.find(p => p.id === provider);
    if (!providerConfig) return null;

    switch (provider) {
      case 'ollama':
        return (
          <OllamaConfigForm
            formData={formData}
            onBaseUrlChange={handleBaseUrlChange}
            onModelChange={handleModelChange}
            onParameterChange={handleParameterChange}
            availableModels={availableModels}
            isLoadingModels={isLoadingModels}
            onRefreshModels={refreshModelList}
            onTest={handleChatTest}
          />
        );
      case 'deepseek':
        return (
          <DeepseekConfigForm
            formData={formData}
            onBaseUrlChange={handleBaseUrlChange}
            onApiKeyChange={handleApiKeyChange}
            onModelChange={handleModelChange}
            onParameterChange={handleParameterChange}
            availableModels={availableModels}
            isLoadingModels={isLoadingModels}
            onRefreshModels={refreshModelList}
            onTest={handleChatTest}
          />
        );
      default:
        return (
          <>
            <Form.Item
              label="服务地址"
              name={['auth', 'baseUrl']}
              rules={[{ required: true, message: '请输入服务地址' }]}
            >
              <Input placeholder="例如: http://localhost:11434" />
            </Form.Item>
            
            {providerConfig.requiresOrganization && (
              <Form.Item
                label="组织ID"
                name={['auth', 'organizationId']}
                rules={[{ required: true, message: '请输入组织ID' }]}
              >
                <Input placeholder="请输入组织ID" />
              </Form.Item>
            )}

            <Form.Item
              label="API密钥"
              name={['auth', 'apiKey']}
              rules={[{ required: true, message: '请输入API密钥' }]}
            >
              <Input.Password placeholder="请输入API密钥" />
            </Form.Item>
          </>
        );
    }
  };

  return (
    <Form form={form} onFinish={handleSubmit} initialValues={initialState}>
      <Form.Item
        label="名称"
        name="name"
        rules={[{ required: true, message: '请输入名称' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="供应商"
        name="provider"
        rules={[{ required: true, message: '请选择供应商' }]}
      >
        <ProviderSelect onChange={handleProviderChange} />
      </Form.Item>

      <Form.Item
        label="服务地址"
        name={['auth', 'baseUrl']}
        rules={[{ required: true, message: '请输入服务地址' }]}
      >
        <Input placeholder="例如: http://localhost:11434" />
      </Form.Item>

      <Form.Item
        label="模型"
        name="model"
        rules={[{ required: true, message: '请选择模型' }]}
      >
        <Space>
          <Select
            placeholder="请选择模型"
            loading={refreshing}
            notFoundContent={refreshing ? <Spin size="small" /> : null}
            onChange={handleModelChange}
            value={formData.model}
            style={{ width: '200px' }}
          >
            {availableModels.map(model => (
              <Select.Option key={model} value={model}>
                {model}
              </Select.Option>
            ))}
          </Select>
          <Button 
            onClick={refreshModelList}
            loading={refreshing}
          >
            刷新
          </Button>
        </Space>
      </Form.Item>

      {/* 参数配置部分 */}
      <Form.Item label="Temperature" name={['parameters', 'temperature']}>
        <Slider
          min={0}
          max={2}
          step={0.1}
          defaultValue={0.7}
        />
      </Form.Item>

      <Form.Item label="Top P" name={['parameters', 'topP']}>
        <Slider
          min={0}
          max={1}
          step={0.1}
          defaultValue={0.9}
        />
      </Form.Item>

      <Form.Item label="最大Token数" name={['parameters', 'maxTokens']}>
        <Slider
          min={100}
          max={4000}
          step={100}
          defaultValue={2000}
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            保存
          </Button>
          <Button onClick={onCancel}>
            取消
          </Button>
          <Button onClick={handleTestConnection} loading={isLoadingModels}>
            测试连接
          </Button>
          <Button onClick={handleChatTest} loading={isLoadingModels}>
            对话测试
          </Button>
        </Space>
      </Form.Item>

      {showTestDialog && currentTestConfig && (
        <ModelTestDialog
          modelConfig={currentTestConfig}
          onClose={() => setShowTestDialog(false)}
          systemPrompt="你是一个有帮助的AI助手。"
        />
      )}
    </Form>
  );
};

export default ModelForm; 