import React from 'react';
import { ProviderType } from '../../../llm/types/providers';
import { ModelConfig, ProviderConfig } from '../../types/config';
import { OllamaProviderForm } from './OllamaProviderForm';
import { SiliconFlowProviderForm } from './SiliconFlowProviderForm';
import { DeepseekProviderForm } from './DeepseekProviderForm';
import { OpenAIProviderForm } from './OpenAIProviderForm';

export interface ProviderFormProps {
  formData: Partial<ModelConfig>;
  providerConfig: ProviderConfig;
  isLoading: boolean;
  onChange: (data: Partial<ModelConfig>) => void;
  onTest?: () => void;
  onRefresh?: () => void;
}

export interface IProviderForm {
  Component: React.FC<ProviderFormProps>;
}

const providerForms: Record<string, IProviderForm> = {
  [ProviderType.OLLAMA]: new OllamaProviderForm(),
  [ProviderType.DEEPSEEK]: new DeepseekProviderForm(),
  [ProviderType.SILICONFLOW]: new SiliconFlowProviderForm(),
  [ProviderType.OPENAI]: new OpenAIProviderForm()
};

export class ProviderFormFactory {
  static createForm(provider: string): IProviderForm {
    const form = providerForms[provider.toLowerCase()];
    if (!form) {
      throw new Error(`未找到供应商表单: ${provider}`);
    }
    return form;
  }
} 