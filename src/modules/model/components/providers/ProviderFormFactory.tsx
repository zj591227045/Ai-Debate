import React from 'react';
import { ProviderType } from '../../../llm/types/providers';
import { ModelConfig, ProviderConfig } from '../../types/config';
import { OllamaProviderForm } from './OllamaProviderForm';
import { SiliconFlowProviderForm } from './SiliconFlowProviderForm';
import { DeepseekProviderForm } from './DeepseekProviderForm';

export interface ProviderFormProps {
  formData: Partial<ModelConfig>;
  providerConfig: ProviderConfig;
  isLoading: boolean;
  onChange: (data: Partial<ModelConfig>) => void;
  onTest?: () => void;
  onRefresh?: () => void;
}

export interface IProviderForm {
  render(): React.ReactNode;
}

export class ProviderFormFactory {
  static createForm(providerType: ProviderType, props: ProviderFormProps): IProviderForm {
    switch (providerType) {
      case ProviderType.OLLAMA:
        return new OllamaProviderForm(props);
      case ProviderType.SILICONFLOW:
        return new SiliconFlowProviderForm(props);
      case ProviderType.DEEPSEEK:
        return new DeepseekProviderForm(props);
      default:
        throw new Error(`不支持的供应商类型: ${providerType}`);
    }
  }
} 