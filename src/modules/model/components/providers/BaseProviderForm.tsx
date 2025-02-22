import React from 'react';
import { ModelConfig, ProviderConfig } from '../../types/config';
import { ProviderFormFactory } from './ProviderFormFactory';
import { ProviderType } from '../../../llm/types/providers';
import './styles.css';

export interface ProviderFormProps {
  formData: Partial<ModelConfig>;
  providerConfig: ProviderConfig;
  isLoading: boolean;
  onChange: (data: Partial<ModelConfig>) => void;
  onTest?: () => void;
  onRefresh?: () => void;
  children?: React.ReactNode;
}

export const BaseProviderForm: React.FC<ProviderFormProps> = ({
  formData,
  providerConfig,
  isLoading,
  onChange,
  onTest,
  onRefresh,
  children
}) => {
  // 使用工厂创建对应的供应商表单实现
  const providerForm = ProviderFormFactory.createForm(providerConfig.code as ProviderType);
  const ProviderFormComponent = providerForm.Component;

  return (
    <div className="provider-form">
      <ProviderFormComponent
        formData={formData}
        providerConfig={providerConfig}
        isLoading={isLoading}
        onChange={onChange}
        onTest={onTest}
        onRefresh={onRefresh}
      />
      {children}
    </div>
  );
}; 