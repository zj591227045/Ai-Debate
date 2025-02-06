import React, { useState, useEffect } from 'react';
import { ModelConfig, PartialModelConfig, DEFAULT_PARAMETER_RANGES, AuthConfig, ModelProvider } from '../../types';
import { useModel } from '../../context/ModelContext';
import { testModelConfig } from '../../utils/modelValidation';
import ModelTestDialog from '../ModelTestDialog';
import { v4 as uuidv4 } from 'uuid';
import './styles.css';
import { ModelProvider as NewModelProvider } from '../../../ai-model/types/providers';
import { AIModelProviderFactory } from '../../../ai-model/services/provider-factory';
import { OllamaConfigForm } from '../providers/OllamaConfigForm';
import { OllamaConfigFactory } from '../../factories/OllamaConfigFactory';
import { DeepseekConfigForm } from '../providers/DeepseekConfigForm';
import { DeepseekConfigFactory } from '../../factories/DeepseekConfigFactory';
import { ModelConfigService } from '../../../storage/services/ModelConfigService';
import { UnifiedLLMService } from '../../../llm/services/UnifiedLLMService';
import { adaptModelConfig } from '../../../llm/utils/adapters';
import { ModelConfig as LLMModelConfig } from '@/modules/llm/types';
import { message } from 'antd';
import { Form, Input, FormInstance, Button } from 'antd';
import { ProviderSelect } from '../providers/ProviderSelect';
import { SiliconFlowConfigForm } from '../providers/SiliconFlowConfigForm';
import { ModelParameters } from '../../types';

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

const defaultParameters = {
  temperature: DEFAULT_PARAMETER_RANGES.temperature.default,
  topP: DEFAULT_PARAMETER_RANGES.topP.default,
  maxTokens: DEFAULT_PARAMETER_RANGES.maxTokens.default,
};

const createInitialState = (model?: ModelConfig): PartialModelConfig => {
  if (model) {
    return { ...model };
  }
  return {
    id: uuidv4(),
    name: '',
    provider: '',
    model: '',
    parameters: defaultParameters,
    auth: {
      apiKey: '',
      organizationId: '',
      baseUrl: '',
    },
    isEnabled: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

export const ModelForm: React.FC<ModelFormProps> = ({ initialValues, onSubmit, onCancel }) => {
  const { dispatch } = useModel();
  const [form] = Form.useForm();
  const [provider, setProvider] = useState<string>(initialValues?.provider || '');
  const [formData, setFormData] = useState<ModelConfig>({
    id: initialValues?.id || '',
    name: initialValues?.name || '',
    provider: initialValues?.provider || '',
    model: initialValues?.model || '',
    parameters: initialValues?.parameters || {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2000
    },
    auth: initialValues?.auth || {
      apiKey: '',
      organizationId: '',
      baseUrl: ''
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
  const providerFactory = new AIModelProviderFactory();
  const modelService = new ModelConfigService();
  const llmService = new UnifiedLLMService();

  const handleProviderChange = (value: string) => {
    setProvider(value);
    setFormData(prev => ({
      ...prev,
      provider: value,
      model: '',
      auth: {
        apiKey: '',
        organizationId: '',
        baseUrl: value === 'ollama' ? 'http://localhost:11434' : 
                value === 'siliconflow' ? 'https://api.siliconflow.cn' : '',
      },
    }));
    // 当切换提供商时，重置模型列表并触发刷新
    setAvailableModels([]);
    if (value) {
      refreshModelList();
    }
  };

  const refreshModelList = async () => {
    console.group('=== 刷新模型列表 ===');
    console.log('表单数据:', formData);
    setIsLoadingModels(true);

    try {
      if (!formData.provider) {
        throw new Error('供应商未选择');
      }

      // 构建临时配置用于获取模型列表
      const tempConfig: LLMModelConfig = {
        id: formData.id || '',
        name: formData.name || '',
        provider: formData.provider,
        model: '',  // 获取模型列表时不需要指定具体模型
        isEnabled: true,
        parameters: {
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1
        },
        auth: {
          baseUrl: formData.auth?.baseUrl || '',
          apiKey: formData.auth?.apiKey || '',
          organizationId: formData.auth?.organizationId || ''
        },
        providerSpecific: {
          baseUrl: formData.auth?.baseUrl || '',
          apiKey: formData.auth?.apiKey || '',
          model: ''  // 获取模型列表时不需要指定具体模型
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      console.log('临时配置:', tempConfig);

      // 获取初始化后的供应商实例
      const provider = await llmService.getInitializedProvider(tempConfig, true);
      console.log('获取到供应商实例');

      if (!provider.listModels) {
        throw new Error('供应商不支持获取模型列表');
      }

      // 获取模型列表
      const models = await provider.listModels();
      console.log('获取到模型列表:', models);
      
      // 更新状态
      setAvailableModels(models);
      console.log('模型列表已更新到状态');
      
      // 如果当前选择的模型不在列表中，清空选择
      if (formData.model && !models.includes(formData.model)) {
        setFormData(prev => ({
          ...prev,
          model: ''
        }));
      }
    } catch (error) {
      console.error('刷新模型列表失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      message.error(`获取模型列表失败: ${errorMessage}`);
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
      console.groupEnd();
    }
  };

  // 当 API 密钥或服务地址改变时,自动刷新模型列表
  useEffect(() => {
    console.log('=== 触发模型列表刷新 ===');
    console.log('provider:', formData.provider);
    console.log('apiKey:', formData.auth?.apiKey);
    console.log('baseUrl:', formData.auth?.baseUrl);
    
    if (formData.provider && (formData.auth?.apiKey || formData.provider === 'ollama')) {
      console.log('满足刷新条件，开始刷新模型列表');
      refreshModelList();
    } else {
      console.log('不满足刷新条件，跳过刷新');
    }
  }, [formData.provider, formData.auth?.apiKey, formData.auth?.baseUrl]);

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

  const getAvailableModels = () => {
    if (formData.provider === 'ollama') {
      return availableModels;
    }
    return ['model1', 'model2']; // Assuming default models
  };

  const handleTestConnection = async () => {
    if (!formData.provider || !formData.model) {
      alert('请先选择供应商和模型');
      return;
    }

    if (formData.provider !== 'ollama' && !formData.auth?.apiKey) {
      alert('请输入API密钥');
      return;
    }

    const completeModel = adaptModelConfig({
      id: formData.id || uuidv4(),
      name: formData.name || '未命名配置',
      provider: formData.provider,
      model: formData.model,
      parameters: {
        temperature: formData.parameters?.temperature ?? defaultParameters.temperature,
        topP: formData.parameters?.topP ?? defaultParameters.topP,
        maxTokens: formData.parameters?.maxTokens ?? defaultParameters.maxTokens,
      },
      auth: {
        apiKey: formData.auth?.apiKey || '',
        organizationId: formData.auth?.organizationId || '',
        baseUrl: formData.auth?.baseUrl || '',
      },
      isEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    setIsTesting(true);
    try {
      // 使用 UnifiedLLMService 测试连接
      const provider = await llmService.getInitializedProvider(completeModel);
      await provider.validateConfig();
      setShowTestDialog(true);
    } catch (error) {
      alert(`连接测试失败：${(error as Error).message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleChatTest = () => {
    if (!formData.provider || !formData.model) {
      message.error('请先选择供应商和模型');
      return;
    }

    if (formData.provider !== 'ollama' && !formData.auth?.apiKey) {
      message.error('请输入API密钥');
      return;
    }

    const completeModel = adaptModelConfig({
      id: formData.id || uuidv4(),
      name: formData.name || '未命名配置',
      provider: formData.provider,
      model: formData.model,
      parameters: {
        temperature: formData.parameters?.temperature ?? defaultParameters.temperature,
        topP: formData.parameters?.topP ?? defaultParameters.topP,
        maxTokens: formData.parameters?.maxTokens ?? defaultParameters.maxTokens,
      },
      auth: {
        apiKey: formData.auth?.apiKey || '',
        organizationId: formData.auth?.organizationId || '',
        baseUrl: formData.auth?.baseUrl || '',
      },
      isEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    setShowChatTestDialog(true);
  };

  const renderProviderConfig = () => {
    const commonProps = {
      formData,
      onBaseUrlChange: handleAuthChange.bind(null, 'baseUrl'),
      onApiKeyChange: handleAuthChange.bind(null, 'apiKey'),
      onModelChange: handleInputChange.bind(null, 'model'),
      onParameterChange: handleParameterChange,
      availableModels,
      isLoadingModels,
      onRefreshModels: refreshModelList,
      onTest: handleChatTest
    };

    switch (formData.provider) {
      case 'ollama':
        return <OllamaConfigForm {...commonProps} />;
      case 'deepseek':
        return <DeepseekConfigForm {...commonProps} />;
      case 'siliconflow':
        return <SiliconFlowConfigForm {...commonProps} />;
      default:
        return null;
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // 合并表单数据
      const submitData = {
        ...formData,
        ...values,
        parameters: {
          temperature: formData.parameters?.temperature ?? defaultParameters.temperature,
          topP: formData.parameters?.topP ?? defaultParameters.topP,
          maxTokens: formData.parameters?.maxTokens ?? defaultParameters.maxTokens,
        },
        auth: {
          ...formData.auth,
          apiKey: formData.auth?.apiKey || '',
          organizationId: formData.auth?.organizationId || '',
          baseUrl: formData.auth?.baseUrl || '',
        }
      };

      // 验证必填字段
      if (!submitData.name?.trim()) {
        message.error('请输入模型名称');
        return;
      }
      if (!submitData.provider) {
        message.error('请选择供应商');
        return;
      }
      if (!submitData.model) {
        message.error('请选择模型');
        return;
      }
      if (submitData.provider !== 'ollama' && !submitData.auth?.apiKey) {
        message.error('请输入API密钥');
        return;
      }

      let completeModel: ModelConfig;
      switch (submitData.provider) {
        case 'ollama':
          completeModel = OllamaConfigFactory.createConfig(submitData);
          break;
        case 'deepseek':
          completeModel = DeepseekConfigFactory.createConfig(submitData);
          break;
        case 'siliconflow':
          completeModel = {
            id: submitData.id || uuidv4(),
            name: submitData.name.trim(),
            provider: submitData.provider,
            model: submitData.model,
            parameters: {
              temperature: submitData.parameters?.temperature ?? defaultParameters.temperature,
              topP: submitData.parameters?.topP ?? defaultParameters.topP,
              maxTokens: submitData.parameters?.maxTokens ?? defaultParameters.maxTokens,
            },
            auth: {
              apiKey: submitData.auth?.apiKey || '',
              organizationId: submitData.auth?.organizationId || '',
              baseUrl: submitData.auth?.baseUrl || '',
            },
            isEnabled: true,
            createdAt: submitData.createdAt || Date.now(),
            updatedAt: Date.now(),
          };
          break;
        default:
          completeModel = {
            id: submitData.id || uuidv4(),
            name: submitData.name.trim(),
            provider: submitData.provider,
            model: submitData.model,
            parameters: {
              temperature: submitData.parameters?.temperature ?? defaultParameters.temperature,
              topP: submitData.parameters?.topP ?? defaultParameters.topP,
              maxTokens: submitData.parameters?.maxTokens ?? defaultParameters.maxTokens,
            },
            auth: {
              apiKey: submitData.auth?.apiKey || '',
              organizationId: submitData.auth?.organizationId || '',
              baseUrl: submitData.auth?.baseUrl || '',
            },
            isEnabled: true,
            createdAt: submitData.createdAt || Date.now(),
            updatedAt: Date.now(),
          };
      }

      try {
        if (initialValues) {
          // 更新现有配置
          await modelService.update(completeModel.id, {
            ...completeModel,
            createdAt: initialValues.createdAt, // 保持原有的创建时间
          });
          dispatch({ type: 'UPDATE_MODEL', payload: completeModel });
          message.success('更新成功');
        } else {
          // 创建新配置
          const now = Date.now();
          const newModel = {
            ...completeModel,
            createdAt: now,
            updatedAt: now,
          };
          await modelService.create(newModel);
          dispatch({ type: 'ADD_MODEL', payload: newModel });
          message.success('创建成功');
        }
        onSubmit(completeModel);
      } catch (error) {
        console.error('保存失败:', error);
        if ((error as Error).message === 'Item not found') {
          // 如果是更新时找不到记录，尝试创建新记录
          const now = Date.now();
          const newModel = {
            ...completeModel,
            createdAt: now,
            updatedAt: now,
          };
          await modelService.create(newModel);
          dispatch({ type: 'ADD_MODEL', payload: newModel });
          message.success('创建成功');
          onSubmit(newModel);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('表单提交失败:', error);
      message.error(`保存失败: ${(error as Error).message}`);
    }
  };

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        initialValues={formData}
        onFinish={handleSubmit}
        className="model-form"
      >
        <Form.Item
          name="name"
          label="模型名称"
          rules={[{ required: true, message: '请输入模型名称' }]}
        >
          <Input placeholder="请输入模型名称" />
        </Form.Item>

        <Form.Item
          name="provider"
          label="选择供应商"
          rules={[{ required: true, message: '请选择供应商' }]}
        >
          <ProviderSelect
            value={provider}
            onChange={(value: string) => {
              handleProviderChange(value);
            }}
          />
        </Form.Item>

        {renderProviderConfig()}

        <div className="form-actions">
          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
            {onCancel && (
              <Button type="default" onClick={onCancel} style={{ marginLeft: 8 }}>
                取消
              </Button>
            )}
          </Form.Item>
        </div>
      </Form>

      {showChatTestDialog && (
        <ModelTestDialog
          model={adaptModelConfig({
            ...formData,
            id: formData.id || uuidv4(),
            name: formData.name || '未命名配置',
            isEnabled: true,
            createdAt: formData.createdAt || Date.now(),
            updatedAt: Date.now(),
          })}
          onClose={() => setShowChatTestDialog(false)}
        />
      )}
    </>
  );
};

export default ModelForm; 