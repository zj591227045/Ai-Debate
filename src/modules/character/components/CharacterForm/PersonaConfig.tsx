import React from 'react';
import { CharacterConfig } from '../../types';
import {
  personalityOptions,
  speakingStyleOptions,
  backgroundOptions,
  valueOptions,
  argumentationStyleOptions,
} from '../../types';

interface PersonaConfigProps {
  data: Partial<CharacterConfig>;
  onChange: (data: Partial<CharacterConfig>) => void;
}

export default function PersonaConfig({ data, onChange }: PersonaConfigProps) {
  // 创建基础persona对象，包含所有必需字段的默认值
  const getBasePersona = () => ({
    personality: data.persona?.personality || [],
    speakingStyle: data.persona?.speakingStyle || speakingStyleOptions[0],
    background: data.persona?.background || backgroundOptions[0],
    values: data.persona?.values || [],
    argumentationStyle: data.persona?.argumentationStyle || [],
    customDescription: data.persona?.customDescription,
  });

  // 通用的更新函数
  const updatePersona = (field: keyof CharacterConfig['persona'], value: any) => {
    onChange({
      ...data,
      persona: {
        ...getBasePersona(),
        [field]: value,
      },
    });
  };

  // 处理多选项的变化
  const handleMultiSelectChange = (field: 'personality' | 'values' | 'argumentationStyle', value: string) => {
    const currentValues = data.persona?.[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    
    updatePersona(field, newValues);
  };

  // 处理单选项的变化
  const handleSelectChange = (field: 'speakingStyle' | 'background') => 
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updatePersona(field, e.target.value);
    };

  return (
    <div className="persona-config">
      <div className="form-group">
        <label>性格特征（可多选）</label>
        <div className="checkbox-group">
          {personalityOptions.map((option) => (
            <label key={option} className="checkbox-label">
              <input
                type="checkbox"
                checked={data.persona?.personality?.includes(option)}
                onChange={() => handleMultiSelectChange('personality', option)}
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="speakingStyle">说话风格</label>
        <select
          id="speakingStyle"
          value={data.persona?.speakingStyle || ''}
          onChange={handleSelectChange('speakingStyle')}
        >
          <option value="">请选择说话风格</option>
          {speakingStyleOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="background">专业背景</label>
        <select
          id="background"
          value={data.persona?.background || ''}
          onChange={handleSelectChange('background')}
        >
          <option value="">请选择专业背景</option>
          {backgroundOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>价值观（可多选）</label>
        <div className="checkbox-group">
          {valueOptions.map((option) => (
            <label key={option} className="checkbox-label">
              <input
                type="checkbox"
                checked={data.persona?.values?.includes(option)}
                onChange={() => handleMultiSelectChange('values', option)}
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>论证风格（可多选）</label>
        <div className="checkbox-group">
          {argumentationStyleOptions.map((option) => (
            <label key={option} className="checkbox-label">
              <input
                type="checkbox"
                checked={data.persona?.argumentationStyle?.includes(option)}
                onChange={() => handleMultiSelectChange('argumentationStyle', option)}
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="customDescription">自定义人设描述</label>
        <textarea
          id="customDescription"
          value={data.persona?.customDescription || ''}
          onChange={(e) => updatePersona('customDescription', e.target.value)}
          placeholder="请输入自定义人设描述"
          rows={4}
        />
      </div>
    </div>
  );
} 
