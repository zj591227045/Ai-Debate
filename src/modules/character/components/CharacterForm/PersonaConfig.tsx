import React, { useState } from 'react';
import { Form, Select, Input, Checkbox, Space, Card, Button } from 'antd';
import { UserOutlined, BulbOutlined, BookOutlined, HeartOutlined, ExperimentOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons';
import styled from '@emotion/styled';
import { CharacterConfig, OPTIONS } from '../../types';
import {
  personalityOptions,
  speakingStyleOptions,
  backgroundOptions,
  valueOptions,
  argumentationStyleOptions,
} from '../../types';
import type { SelectProps } from 'antd';

const { TextArea } = Input;

const ConfigSection = styled.div`
  margin-bottom: 16px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e6e8ff;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #1f1f1f;
  margin-bottom: 12px;
  
  .anticon {
    color: #4157ff;
  }
`;

const OptionGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
`;

const StyledCheckbox = styled(Checkbox)`
  &:hover .ant-checkbox-inner {
    border-color: #4157ff;
  }
  
  .ant-checkbox-checked .ant-checkbox-inner {
    background-color: #4157ff;
    border-color: #4157ff;
  }
`;

const StyledSelect = styled(Select)`
  width: 100%;
  
  .ant-select-selector {
    border-radius: 6px;
  }
  
  &:hover .ant-select-selector {
    border-color: #4157ff;
  }
  
  &.ant-select-focused .ant-select-selector {
    border-color: #4157ff;
    box-shadow: 0 0 0 2px rgba(65, 87, 255, 0.1);
  }
`;

const StyledTextArea = styled(TextArea)`
  border-radius: 6px;
  
  &:hover {
    border-color: #4157ff;
  }
  
  &:focus {
    border-color: #4157ff;
    box-shadow: 0 0 0 2px rgba(65, 87, 255, 0.1);
  }
`;

const CustomInputSection = styled.div`
  margin-top: 12px;
  display: flex;
  gap: 8px;
`;

const StyledInput = styled(Input)`
  flex: 1;
  border-radius: 6px;
  
  &:hover {
    border-color: #4157ff;
  }
  
  &:focus {
    border-color: #4157ff;
    box-shadow: 0 0 0 2px rgba(65, 87, 255, 0.1);
  }
`;

const AddButton = styled(Button)`
  color: #4157ff;
  border-color: #4157ff;
  
  &:hover {
    color: #6677ff;
    border-color: #6677ff;
  }
`;

const SelectedItemsSection = styled.div`
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const SelectedItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f0f2ff;
  border: 1px solid #e6e8ff;
  border-radius: 4px;
  font-size: 14px;
  color: #4157ff;

  .anticon {
    cursor: pointer;
    font-size: 12px;
    
    &:hover {
      color: #f5222d;
    }
  }
`;

interface MultiSelectSectionProps {
  title: string;
  icon: React.ReactNode;
  options: string[];
  value: string[];
  onChange: (newValue: string[]) => void;
  customPlaceholder: string;
}

const MultiSelectSection: React.FC<MultiSelectSectionProps> = ({
  title,
  icon,
  options,
  value = [],
  onChange,
  customPlaceholder,
}) => {
  const [customInput, setCustomInput] = useState('');

  const handleAdd = () => {
    if (customInput && !value.includes(customInput)) {
      onChange([...value, customInput]);
      setCustomInput('');
    }
  };

  const handleRemove = (item: string) => {
    onChange(value.filter(v => v !== item));
  };

  const customItems = value.filter(item => !options.includes(item));

  return (
    <ConfigSection>
      <SectionTitle>
        {icon}
        {title}
      </SectionTitle>
      <OptionGroup>
        {options.map(option => (
          <StyledCheckbox
            key={option}
            checked={value.includes(option)}
            onChange={e => {
              const newValue = e.target.checked
                ? [...value, option]
                : value.filter(v => v !== option);
              onChange(newValue);
            }}
          >
            {option}
          </StyledCheckbox>
        ))}
      </OptionGroup>
      {customItems.length > 0 && (
        <SelectedItemsSection>
          {customItems.map(item => (
            <SelectedItem key={item}>
              {item}
              <CloseOutlined onClick={() => handleRemove(item)} />
            </SelectedItem>
          ))}
        </SelectedItemsSection>
      )}
      <CustomInputSection>
        <StyledInput
          placeholder={customPlaceholder}
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onPressEnter={handleAdd}
        />
        <AddButton 
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          添加
        </AddButton>
      </CustomInputSection>
    </ConfigSection>
  );
};

interface SingleSelectWithCustomSectionProps {
  title: string;
  icon: React.ReactNode;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  customPlaceholder: string;
}

const SingleSelectWithCustomSection: React.FC<SingleSelectWithCustomSectionProps> = ({
  title,
  icon,
  options,
  value,
  onChange,
  placeholder,
  customPlaceholder,
}) => {
  const [customInput, setCustomInput] = useState('');
  const isCustomValue = value && !options.includes(value);

  const handleAdd = () => {
    if (customInput && customInput !== value) {
      onChange(customInput);
      setCustomInput('');
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  const handleSelectChange: SelectProps['onChange'] = (newValue) => {
    onChange(newValue as string);
  };

  return (
    <ConfigSection>
      <SectionTitle>
        {icon}
        {title}
      </SectionTitle>
      <StyledSelect
        placeholder={placeholder}
        value={isCustomValue ? undefined : value}
        onChange={handleSelectChange}
        options={options.map(option => ({ label: option, value: option }))}
      />
      {isCustomValue && (
        <SelectedItemsSection>
          <SelectedItem>
            {value}
            <CloseOutlined onClick={handleRemove} />
          </SelectedItem>
        </SelectedItemsSection>
      )}
      <CustomInputSection>
        <StyledInput
          placeholder={customPlaceholder}
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onPressEnter={handleAdd}
        />
        <AddButton 
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          添加
        </AddButton>
      </CustomInputSection>
    </ConfigSection>
  );
};

interface PersonaConfigProps {
  data: Partial<CharacterConfig>;
  onChange: (data: Partial<CharacterConfig>) => void;
}

const personalityOpts = [...OPTIONS.personality];
const valueOpts = [...OPTIONS.values];
const argumentationStyleOpts = [...OPTIONS.argumentationStyle];

export default function PersonaConfig({ data, onChange }: PersonaConfigProps) {
  const handlePersonaChange = (field: keyof CharacterConfig['persona'], value: any) => {
    const updatedPersona = {
      personality: data.persona?.personality || [],
      speakingStyle: data.persona?.speakingStyle || '',
      background: data.persona?.background || '',
      values: data.persona?.values || [],
      argumentationStyle: data.persona?.argumentationStyle || [],
      customDescription: data.persona?.customDescription,
      [field]: value,
    };

    onChange({
      ...data,
      persona: updatedPersona,
    });
  };

  return (
    <div className="persona-config">
      <MultiSelectSection
        title="性格特征（可多选）"
        icon={<UserOutlined />}
        options={[...personalityOpts]}
        value={data.persona?.personality || []}
        onChange={value => handlePersonaChange('personality', value)}
        customPlaceholder="输入自定义性格特征"
      />

      <SingleSelectWithCustomSection
        title="说话风格"
        icon={<BulbOutlined />}
        options={[...speakingStyleOptions]}
        value={data.persona?.speakingStyle || ''}
        onChange={value => handlePersonaChange('speakingStyle', value)}
        placeholder="请选择说话风格"
        customPlaceholder="输入自定义说话风格"
      />

      <SingleSelectWithCustomSection
        title="专业背景"
        icon={<BookOutlined />}
        options={[...backgroundOptions]}
        value={data.persona?.background || ''}
        onChange={value => handlePersonaChange('background', value)}
        placeholder="请选择专业背景"
        customPlaceholder="输入自定义专业背景"
      />

      <MultiSelectSection
        title="价值观（可多选）"
        icon={<HeartOutlined />}
        options={valueOpts}
        value={data.persona?.values || []}
        onChange={value => handlePersonaChange('values', value)}
        customPlaceholder="输入自定义价值观"
      />

      <MultiSelectSection
        title="论证风格（可多选）"
        icon={<ExperimentOutlined />}
        options={argumentationStyleOpts}
        value={data.persona?.argumentationStyle || []}
        onChange={value => handlePersonaChange('argumentationStyle', value)}
        customPlaceholder="输入自定义论证风格"
      />

      <ConfigSection>
        <SectionTitle>
          <UserOutlined />
          自定义人设描述
        </SectionTitle>
        <StyledTextArea
          placeholder="请输入自定义人设描述"
          value={data.persona?.customDescription}
          onChange={e => handlePersonaChange('customDescription', e.target.value)}
          rows={4}
        />
      </ConfigSection>
    </div>
  );
} 
