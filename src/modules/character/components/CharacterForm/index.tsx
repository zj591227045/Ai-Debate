import React, { useState } from 'react';
import { Tabs, Steps, message } from 'antd';
import { UserOutlined, RobotOutlined, SettingOutlined } from '@ant-design/icons';
import type { CharacterConfig } from '../../types/character';
import BasicInfo from './BasicInfo';
import PersonaConfig from './PersonaConfig';
import CallModeConfig from './CallModeConfig';
import { useCharacter } from '../../context/CharacterContext';
import { ModelProvider } from '../../../model/context/ModelContext';
import { v4 as uuidv4 } from 'uuid';
import './styles.css';
import { PROVIDERS } from '../../../llm/types/providers';

const { TabPane } = Tabs;

interface CharacterFormProps {
  character?: CharacterConfig;
  onSubmit?: (character: CharacterConfig) => void;
  onCancel?: () => void;
}

interface StepComponentProps {
  data: CharacterConfig;
  onChange: (data: Partial<CharacterConfig>) => void;
}

type StepComponent = React.ComponentType<StepComponentProps>;

interface Step {
  title: string;
  icon: React.ReactNode;
  component: StepComponent;
}

const steps: Step[] = [
  {
    title: '基本信息',
    icon: <UserOutlined />,
    component: BasicInfo,
  },
  {
    title: '人设配置',
    icon: <RobotOutlined />,
    component: PersonaConfig,
  },
  {
    title: '调用配置',
    icon: <SettingOutlined />,
    component: CallModeConfig,
  }
];

const createDefaultCharacter = (now: number): CharacterConfig => ({
  id: '',
  name: '',
  description: '',
  isTemplate: false,
  persona: {
    personality: [],
    speakingStyle: '',
    background: '',
    values: [],
    argumentationStyle: [],
    customDescription: '',
  },
  callConfig: {
    type: 'direct',
    direct: {
      provider: PROVIDERS.OLLAMA,
      modelId: '',
      model: ''
    }
  },
  createdAt: now,
  updatedAt: now
});

export default function CharacterForm({ 
  character, 
  onSubmit, 
  onCancel 
}: CharacterFormProps) {
  const { dispatch } = useCharacter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CharacterConfig>(() => {
    const now = Date.now();
    if (character) {
      // 确保保留所有必需字段
      const base = createDefaultCharacter(now);
      return {
        ...base,
        ...character,
        id: character.id || uuidv4(),
        createdAt: character.createdAt || now,
        updatedAt: now,
        isTemplate: character.isTemplate || false,
        persona: {
          ...base.persona,
          ...character.persona
        },
        callConfig: {
          ...base.callConfig,
          ...character.callConfig
        }
      };
    }
    return createDefaultCharacter(now);
  });

  const handleFormDataChange = (data: Partial<CharacterConfig>) => {
    setFormData(prev => ({
      ...prev,
      ...data,
      updatedAt: Date.now()
    }));
  };

  const handleStepChange = (step: number) => {
    // 验证当前步骤
    if (currentStep === 0 && !formData.name) {
      message.warning('请填写角色名称');
      return;
    }
    if (currentStep === 1 && (!formData.persona?.personality?.length || !formData.persona?.speakingStyle)) {
      message.warning('请完善人设配置');
      return;
    }
    setCurrentStep(step);
  };

  const handleSubmit = () => {
    console.log('提交表单数据:', formData);
    
    // 验证必填字段
    if (!formData.name) {
      message.error('请填写角色名称');
      setCurrentStep(0);
      return;
    }

    if (!formData.persona?.personality?.length || 
        !formData.persona?.speakingStyle ||
        !formData.persona?.background ||
        !formData.persona?.values?.length ||
        !formData.persona?.argumentationStyle?.length) {
      message.error('请完善人设配置');
      setCurrentStep(1);
      return;
    }

    if (!formData.callConfig?.type) {
      message.error('请配置调用模式');
      setCurrentStep(2);
      return;
    }

    if (formData.callConfig.type === 'direct' && !formData.callConfig.direct?.modelId) {
      message.error('请选择模型');
      setCurrentStep(2);
      return;
    }

    if (formData.callConfig.type === 'dify' && (!formData.callConfig.dify?.serverUrl || !formData.callConfig.dify?.apiKey)) {
      message.error('请完善Dify配置');
      setCurrentStep(2);
      return;
    }

    const now = Date.now();
    const completeData: CharacterConfig = {
      ...formData,
      id: formData.id || uuidv4(),
      name: formData.name,
      description: formData.description || '',
      persona: {
        personality: formData.persona.personality,
        speakingStyle: formData.persona.speakingStyle,
        background: formData.persona.background,
        values: formData.persona.values,
        argumentationStyle: formData.persona.argumentationStyle,
        customDescription: formData.persona.customDescription || ''
      },
      callConfig: {
        type: formData.callConfig.type,
        direct: formData.callConfig.type === 'direct' ? {
          provider: formData.callConfig.direct?.provider || PROVIDERS.OLLAMA,
          modelId: formData.callConfig.direct?.modelId || '',
          model: formData.callConfig.direct?.model || ''
        } : undefined,
        dify: formData.callConfig.type === 'dify' ? {
          serverUrl: formData.callConfig.dify?.serverUrl || '',
          apiKey: formData.callConfig.dify?.apiKey || ''
        } : undefined
      },
      isTemplate: formData.isTemplate || false,
      createdAt: formData.createdAt || now,
      updatedAt: now
    };

    console.log('准备保存角色配置:', completeData);

    // 更新状态
    if (character) {
      // 如果是编辑现有角色
      dispatch({ type: 'UPDATE_CHARACTER', payload: completeData });
      console.log('更新现有角色:', completeData.id);
    } else {
      // 如果是创建新角色
      dispatch({ type: 'ADD_CHARACTER', payload: completeData });
      console.log('创建新角色:', completeData.id);
    }
 
    message.success('保存成功');
    onSubmit?.(completeData);
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <ModelProvider>
      <div className="character-form">
        <div className="character-form-header">
          <h2 className="character-form-title">
            {character ? '编辑角色' : '创建新角色'}
          </h2>
          <p className="character-form-subtitle">
            配置AI角色的基本信息、人设和调用方式
          </p>
        </div>

        <Steps 
          current={currentStep}
          onChange={handleStepChange}
          items={steps.map((step, index) => ({
            title: step.title,
            icon: step.icon,
            status: index < currentStep ? 'finish' : index === currentStep ? 'process' : 'wait',
          }))}
        />

        <div className="character-form-content">
          <CurrentStepComponent
            data={formData}
            onChange={handleFormDataChange}
          />
        </div>

        <div className="character-form-actions">
          {currentStep > 0 && (
            <button
              onClick={() => handleStepChange(currentStep - 1)}
              className="ant-btn ant-btn-default"
            >
              上一步
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => handleStepChange(currentStep + 1)}
              className="ant-btn ant-btn-primary"
            >
              下一步
            </button>
          ) : (
            <button onClick={handleSubmit} className="ant-btn ant-btn-primary">
              保存
            </button>
          )}

          {onCancel && (
            <button onClick={onCancel} className="ant-btn ant-btn-default">
              取消
            </button>
          )}
        </div>
      </div>
    </ModelProvider>
  );
}