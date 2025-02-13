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
import { ModelConfig as LLMModelConfig } from '../../../llm/types';
import { message } from 'antd';
import { Form, Input, FormInstance, Button, Select, Slider, Space, Spin } from 'antd';
import { ProviderSelect } from '../providers/ProviderSelect';
import { SiliconFlowConfigForm } from '../providers/SiliconFlowConfigForm';
import { ModelParameters } from '../../types';
import { DEFAULT_PROVIDERS } from '../../types';

interface ModelFormProps {
  initialValues?: ModelConfig;
  onSubmit: (values: Omit<ModelConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
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
  const { addModel, updateModel } = useModel();
  const [form] = Form.useForm();
  const [provider, setProvider] = useState<string>(initialValues?.provider || '');
  const initialState = initialValues || {
    name: '',
    provider: 'ollama',
    model: '',
    parameters: defaultParameters,
    auth: {
      baseUrl: 'http://localhost:11434',
      apiKey: '',
      organizationId: ''
    },
    isEnabled: true
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

  const handleProviderChange = (value: string) => {
    setProvider(value);
    const providerConfig = DEFAULT_PROVIDERS.find(p => p.id === value);
    if (providerConfig) {
      form.setFieldsValue({
        auth: {
          baseUrl: providerConfig.defaultBaseUrl || ''
        }
      });
    }
  };

  const refreshModelList = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      const apiKey = form.getFieldValue(['auth', 'apiKey']);
      const baseUrl = form.getFieldValue(['auth', 'baseUrl']);
      
      console.log('Refreshing model list with:', {
        baseUrl,
        apiKey: apiKey ? '***' : undefined
      });

      if (!apiKey) {
        throw new Error('请先输入API密钥');
      }

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
          baseUrl,
          apiKey
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
      message.error('获取模型列表失败: ' + (error instanceof Error ? error.message : '未知错误'));
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
    // 更新 formData
    setFormData(prev => ({
      ...prev,
      auth: {
        ...prev.auth,
        apiKey: value
      }
    }));
    
    // 更新表单字段
    form.setFieldsValue({
      auth: {
        ...form.getFieldValue('auth'),
        apiKey: value
      }
    });
    
    // 如果已经有了服务地址，尝试刷新模型列表
    if (formData.auth?.baseUrl) {
      refreshModelList();
    }
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (err) {
      console.error('表单验证失败:', err);
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
      case 'siliconflow':
        return (
          <SiliconFlowConfigForm
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

  useEffect(() => {
    form.setFieldsValue(initialState);
  }, [form, initialState]);

  return (
    <Form
      form={form}
      layout="vertical"
      className="model-form"
      initialValues={initialState}
    >
      <Form.Item
        name="name"
        label="名称"
        rules={[{ required: true, message: '请输入模型配置名称' }]}
      >
        <Input placeholder="请输入模型配置名称" />
      </Form.Item>

      <Form.Item
        name="provider"
        label="供应商"
        rules={[{ required: true, message: '请选择供应商' }]}
      >
        <Select
          placeholder="请选择供应商"
          onChange={handleProviderChange}
        >
          {DEFAULT_PROVIDERS.map(provider => (
            <Select.Option key={provider.id} value={provider.id}>
              {provider.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* 根据供应商渲染不同的配置表单 */}
      {renderProviderConfig()}

      <Form.Item
        name="model"
        label="模型"
        rules={[{ required: true, message: '请选择模型' }]}
      >
        <Select placeholder="请选择模型">
          {DEFAULT_PROVIDERS.find(p => p.id === provider)?.models.map(model => (
            <Select.Option key={model} value={model}>
              {model}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="参数配置"
        required
      >
        <Form.Item
          name={['parameters', 'temperature']}
          label="Temperature"
        >
          <Slider
            min={0}
            max={2}
            step={0.1}
            defaultValue={defaultParameters.temperature}
          />
        </Form.Item>

        <Form.Item
          name={['parameters', 'topP']}
          label="Top P"
        >
          <Slider
            min={0}
            max={1}
            step={0.1}
            defaultValue={defaultParameters.topP}
          />
        </Form.Item>

        <Form.Item
          name={['parameters', 'maxTokens']}
          label="Max Tokens"
        >
          <Slider
            min={100}
            max={8192}
            step={100}
            defaultValue={defaultParameters.maxTokens}
          />
        </Form.Item>
      </Form.Item>

      <Form.Item label="认证配置">
        <Form.Item
          name={['auth', 'baseUrl']}
          label="Base URL"
        >
          <Input placeholder="请输入Base URL" />
        </Form.Item>

        <Form.Item
          name={['auth', 'apiKey']}
          label="API Key"
        >
          <Input.Password placeholder="请输入API Key" />
        </Form.Item>

        <Form.Item
          name={['auth', 'organizationId']}
          label="Organization ID"
        >
          <Input placeholder="请输入Organization ID（可选）" />
        </Form.Item>
      </Form.Item>

      <Form.Item
        name="isEnabled"
        valuePropName="checked"
        initialValue={true}
      >
        <Space>
          启用此配置
        </Space>
      </Form.Item>

      <div className="form-actions">
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" onClick={handleSubmit}>
          保存
        </Button>
      </div>

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