import React, { useState } from 'react';
import { Steps, message, Modal } from 'antd';
import { UserOutlined, RobotOutlined, SettingOutlined } from '@ant-design/icons';
import type { CharacterConfig } from '../../types/character';
import BasicInfo from './BasicInfo';
import PersonaConfig from './PersonaConfig';
import CallModeConfig from './CallModeConfig';
import { useCharacter } from '../../context/CharacterContext';
import { ModelProvider } from '../../../model/context/ModelContext';
import { v4 as uuidv4 } from 'uuid';
import { PROVIDERS } from '../../../llm/types/providers';
import styled from '@emotion/styled';

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

// 基础容器样式
const FormContainer = styled.div`
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
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const FormHeader = styled.div`
  text-align: center;
  margin-bottom: 1rem;
`;

const FormTitle = styled.h2`
  color: #E8F0FF;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 
    0 0 10px rgba(167,187,255,0.5),
    0 0 20px rgba(167,187,255,0.3);
`;

const FormSubtitle = styled.p`
  color: rgba(232,240,255,0.7);
  font-size: 0.9rem;
  margin: 0.5rem 0 0;
  text-shadow: 0 0 10px rgba(167,187,255,0.3);
`;

const StyledSteps = styled(Steps)`
  .ant-steps-item-icon {
    background: rgba(167,187,255,0.1);
    border-color: rgba(167,187,255,0.3);
    
    .ant-steps-icon {
      color: rgba(232,240,255,0.9);
    }
  }

  .ant-steps-item-title {
    color: rgba(232,240,255,0.7) !important;
  }

  .ant-steps-item-description {
    color: rgba(232,240,255,0.5) !important;
  }

  .ant-steps-item-finish {
    .ant-steps-item-icon {
      background: linear-gradient(45deg, #4157ff, #0057ff);
      border-color: rgba(167,187,255,0.4);
    }

    .ant-steps-item-title {
      color: #E8F0FF !important;
    }

    .ant-steps-finish-icon {
      color: #E8F0FF;
    }
  }

  .ant-steps-item-process {
    .ant-steps-item-icon {
      background: linear-gradient(45deg, #4157ff, #0057ff);
      border-color: rgba(167,187,255,0.4);
    }

    .ant-steps-item-title {
      color: #E8F0FF !important;
      text-shadow: 0 0 10px rgba(167,187,255,0.5);
    }
  }

  .ant-steps-item-wait {
    .ant-steps-item-icon {
      background: rgba(167,187,255,0.05);
      border-color: rgba(167,187,255,0.2);
    }
  }
`;

const FormContent = styled.div`
  flex: 1;
  background: rgba(167,187,255,0.05);
  border-radius: 12px;
  border: 1px solid rgba(167,187,255,0.1);
  padding: 2rem;
  overflow-y: auto;
  max-height: calc(100vh - 300px);

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(167,187,255,0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(167,187,255,0.2);
    border-radius: 4px;
    
    &:hover {
      background: rgba(167,187,255,0.3);
    }
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
`;

const ActionButton = styled.button<{ $primary?: boolean }>`
  flex: 1;
  height: 40px;
  border: 1px solid rgba(167,187,255,0.3);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  ${props => props.$primary ? `
    background: linear-gradient(45deg, #4157ff, #0057ff);
    color: #E8F0FF;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(31, 38, 135, 0.3);
      border-color: rgba(167,187,255,0.4);
    }
  ` : `
    background: rgba(167,187,255,0.1);
    color: rgba(232,240,255,0.9);
    
    &:hover {
      background: rgba(167,187,255,0.2);
      border-color: rgba(167,187,255,0.3);
      color: #E8F0FF;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// 添加Modal样式
const StyledModal = styled(Modal)`
  .ant-modal-content {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(167,187,255,0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  }

  .ant-modal-header {
    background: transparent;
    border-bottom: 1px solid rgba(167,187,255,0.1);
  }

  .ant-modal-title {
    color: #E8F0FF;
  }

  .ant-modal-close {
    color: rgba(232,240,255,0.7);
    
    &:hover {
      color: #E8F0FF;
    }
  }

  .ant-modal-body {
    padding: 0;
  }
`;

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
      <FormContainer>
        <FormHeader>
          <FormTitle>
            {character ? '编辑角色' : '创建新角色'}
          </FormTitle>
          <FormSubtitle>
            配置AI角色的基本信息、人设和调用方式
          </FormSubtitle>
        </FormHeader>

        <StyledSteps 
          current={currentStep}
          onChange={handleStepChange}
          items={steps.map((step, index) => ({
            title: step.title,
            icon: step.icon,
            status: index < currentStep ? 'finish' : index === currentStep ? 'process' : 'wait',
          }))}
        />

        <FormContent>
          <CurrentStepComponent
            data={formData}
            onChange={handleFormDataChange}
          />
        </FormContent>

        <FormActions>
          {currentStep > 0 && (
            <ActionButton
              onClick={() => handleStepChange(currentStep - 1)}
            >
              上一步
            </ActionButton>
          )}
          {currentStep < steps.length - 1 ? (
            <ActionButton
              $primary
              onClick={() => handleStepChange(currentStep + 1)}
            >
              下一步
            </ActionButton>
          ) : (
            <ActionButton
              $primary
              onClick={handleSubmit}
            >
              完成
            </ActionButton>
          )}
          <ActionButton
            onClick={onCancel}
          >
            取消
          </ActionButton>
        </FormActions>
      </FormContainer>
    </ModelProvider>
  );
}