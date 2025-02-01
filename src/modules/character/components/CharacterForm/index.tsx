import React, { useState } from 'react';
import { CharacterConfig } from '../../types';
import BasicInfo from './BasicInfo';
import PersonaConfig from './PersonaConfig';
import ModelSelect from './ModelSelect';
import { useCharacter } from '../../context/CharacterContext';
import { ModelProvider } from '../../../model/context/ModelContext';
import { v4 as uuidv4 } from 'uuid';

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
      modelId: '',
    }
  );

  const steps = [
    {
      title: '基本信息',
      component: BasicInfo,
    },
    {
      title: '人设配置',
      component: PersonaConfig,
    },
    {
      title: '模型选择',
      component: ModelSelect,
    },
  ];

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handleFormDataChange = (data: Partial<CharacterConfig>) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
  };

  const handleSubmit = () => {
    if (!formData.modelId) {
      alert('请选择一个模型');
      setCurrentStep(2);
      return;
    }

    const completeCharacter = formData as CharacterConfig;
    if (character) {
      dispatch({ type: 'UPDATE_CHARACTER', payload: completeCharacter });
    } else {
      dispatch({ type: 'ADD_CHARACTER', payload: completeCharacter });
    }
    onSubmit?.(completeCharacter);
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <ModelProvider>
      <div className="character-form">
        <div className="character-form-steps">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`step ${index === currentStep ? 'active' : ''}`}
              onClick={() => handleStepChange(index)}
            >
              {step.title}
            </div>
          ))}
        </div>

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
              className="btn-secondary"
            >
              上一步
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => handleStepChange(currentStep + 1)}
              className="btn-primary"
            >
              下一步
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn-primary">
              保存
            </button>
          )}

          {onCancel && (
            <button onClick={onCancel} className="btn-secondary">
              取消
            </button>
          )}
        </div>
      </div>
    </ModelProvider>
  );
} 