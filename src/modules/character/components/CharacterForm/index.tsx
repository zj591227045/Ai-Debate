import React, { useState } from 'react';
import { Tabs, Steps, message, Form, Input, Button } from 'antd';
import { UserOutlined, RobotOutlined, SettingOutlined } from '@ant-design/icons';
import { CharacterConfig } from '../../types';
import BasicInfo from './BasicInfo';
import PersonaConfig from './PersonaConfig';
import CallModeConfig from './CallModeConfig';
import { ModelProvider } from '../../../model/context/ModelContext';
import { v4 as uuidv4 } from 'uuid';
import './styles.css';
import { PROVIDERS } from '../../../llm/types/providers';
import { StateManager } from '../../../../store/unified/StateManager';
import type { UnifiedState } from '../../../../store/unified/types';

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

  const handleSubmit = async (values: any) => {
    try {
      const characterData: CharacterConfig = {
        ...values,
        id: character?.id || Date.now().toString(),
        updatedAt: Date.now()
      };

      const stateManager = StateManager.getInstance();

      if (character?.id) {
        stateManager.dispatch({
          type: 'CHARACTER_UPDATED',
          payload: { id: character.id, changes: characterData }
        });
      } else {
        stateManager.dispatch({
          type: 'CHARACTER_ADDED',
          payload: characterData
        });
      }

      message.success('保存成功');
      if (onSubmit) {
        onSubmit(characterData);
      }
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
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