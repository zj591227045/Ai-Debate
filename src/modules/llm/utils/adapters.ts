import { ModelConfig as LLMModelConfig, ModelParameters, AuthConfig, ProviderSpecificConfig, BaseProviderConfig } from '../types';
import { ModelConfig as UIModelConfig } from '../../model/types';
import { ProviderType, OllamaConfig, DeepseekConfig, VolcengineConfig } from '../types/providers';

/**
 * 适配模型参数
 */
function adaptModelParameters(params: Partial<ModelParameters> = {}): ModelParameters {
  return {
    temperature: params.temperature ?? 0.7,
    maxTokens: params.maxTokens ?? 2000,
    topP: params.topP ?? 1,
    // 可选参数保持原样
    ...(params.frequencyPenalty !== undefined && { frequencyPenalty: params.frequencyPenalty }),
    ...(params.presencePenalty !== undefined && { presencePenalty: params.presencePenalty }),
    ...(params.stop !== undefined && { stop: params.stop }),
    ...(params.stream !== undefined && { stream: params.stream }),
  };
}

/**
 * 将UI模型配置转换为LLM服务模型配置
 */
export function adaptModelConfig(uiConfig: UIModelConfig): LLMModelConfig {
  // 基础配置转换
  const baseConfig = {
    id: uiConfig.id,
    name: uiConfig.name,
    provider: uiConfig.provider,
    model: uiConfig.model,
    isEnabled: uiConfig.isEnabled,
    createdAt: uiConfig.createdAt || Date.now(),
    updatedAt: uiConfig.updatedAt || Date.now()
  };

  // 转换参数配置
  const parameters = adaptModelParameters(uiConfig.parameters);

  // 转换认证配置
  const auth: AuthConfig = {
    baseUrl: uiConfig.auth?.baseUrl || '',
    apiKey: uiConfig.auth?.apiKey || '',
    organizationId: uiConfig.auth?.organizationId,
  };

  // 转换供应商特定配置
  let providerSpecific: ProviderSpecificConfig;
  
  switch (uiConfig.provider) {
    case ProviderType.OLLAMA:
      providerSpecific = {
        baseUrl: auth.baseUrl,
        model: uiConfig.model,
        useLocalEndpoint: true,
      } as OllamaConfig;
      break;
    
    case ProviderType.DEEPSEEK:
      providerSpecific = {
        baseUrl: auth.baseUrl,
        model: uiConfig.model,
        apiKey: auth.apiKey,
        organizationId: auth.organizationId,
      } as DeepseekConfig;
      break;
    
    case ProviderType.VOLCENGINE:
      providerSpecific = {
        baseUrl: auth.baseUrl,
        model: uiConfig.model,
        apiKey: auth.apiKey,
        apiSecret: uiConfig.providerSpecific?.apiSecret || '',
        endpointId: uiConfig.providerSpecific?.endpointId || '',
      } as VolcengineConfig;
      break;
    
    case 'siliconflow':
      providerSpecific = {
        baseUrl: auth.baseUrl || 'https://api.siliconflow.cn',
        model: uiConfig.model,
        apiKey: auth.apiKey,
        organizationId: auth.organizationId,
        options: {
          temperature: parameters.temperature,
          maxTokens: parameters.maxTokens,
          topP: parameters.topP,
        }
      };
      break;
    
    default:
      providerSpecific = {
        baseUrl: auth.baseUrl,
        model: uiConfig.model,
      } as BaseProviderConfig;
  }

  return {
    ...baseConfig,
    parameters,
    auth,
    providerSpecific,
  };
}

/**
 * 将LLM服务模型配置转换为UI模型配置
 */
export function adaptLLMConfig(llmConfig: LLMModelConfig): UIModelConfig {
  const baseConfig = {
    id: llmConfig.id,
    name: llmConfig.name,
    provider: llmConfig.provider,
    model: llmConfig.model,
    isEnabled: llmConfig.isEnabled,
    parameters: llmConfig.parameters,
    createdAt: llmConfig.createdAt,
    updatedAt: llmConfig.updatedAt
  };

  // 转换认证配置
  const auth = {
    baseUrl: llmConfig.auth.baseUrl,
    apiKey: llmConfig.auth.apiKey || '',
    organizationId: llmConfig.auth.organizationId || '',
  };

  // 转换供应商特定配置
  const providerSpecific = llmConfig.providerSpecific || {};

  return {
    ...baseConfig,
    auth,
    providerSpecific,
  };
} 