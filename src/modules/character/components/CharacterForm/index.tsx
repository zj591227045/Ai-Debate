import React, { useState } from 'react';
import { Tabs, Steps, message } from 'antd';
import { UserOutlined, RobotOutlined, SettingOutlined } from '@ant-design/icons';
import { CharacterConfig } from '../../types';
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

export default function CharacterForm({ 
  character, 
  onSubmit, 
  onCancel 
}: CharacterFormProps) {
  const { dispatch } = useCharacter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<CharacterConfig>>(
    character || {
      id: uuidv4(),
      name: '',
      description: '',
      persona: {
        personality: [],
        speakingStyle: '',
        background: '',
        values: [],
        argumentationStyle: [],
        customDescription: '',
      },
      callConfig: {
        type: 'direct' as const,
        direct: {
          provider: PROVIDERS.OLLAMA,
          modelId: '',
          model: ''
        }
      }
    }
  );

  const steps = [
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

  const handleFormDataChange = (data: Partial<CharacterConfig>) => {
    console.log('表单数据变更:', data);
    setFormData((prev) => {
      const newData = {
        ...prev,
        ...data,
      };
      console.log('更新后的表单数据:', newData);
      return newData;
    });
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

    // 生成一个唯一的英文ID
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const characterId = character?.id || `char_${timestamp}_${randomStr}`;

    const completeCharacter: CharacterConfig = {
      id: characterId,
      name: formData.name!,
      avatar: formData.avatar,
      description: formData.description || '',
      persona: {
        personality: formData.persona!.personality,
        speakingStyle: formData.persona!.speakingStyle,
        background: formData.persona!.background,
        values: formData.persona!.values,
        argumentationStyle: formData.persona!.argumentationStyle,
        customDescription: formData.persona!.customDescription || '',
      },
      callConfig: formData.callConfig!,
      createdAt: character?.createdAt || timestamp,
      updatedAt: timestamp,
    };

    console.log('准备保存角色:', completeCharacter);
    
    if (character) {
      console.log('更新现有角色');
      dispatch({ type: 'UPDATE_CHARACTER', payload: completeCharacter });
    } else {
      console.log('创建新角色');
      dispatch({ type: 'ADD_CHARACTER', payload: completeCharacter });
    }
    
    message.success('保存成功');
    onSubmit?.(completeCharacter);
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