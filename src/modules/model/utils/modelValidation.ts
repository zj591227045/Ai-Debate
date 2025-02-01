import { ModelConfig, DEFAULT_PARAMETER_RANGES } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateModelConfig(config: Partial<ModelConfig>): ValidationResult {
  const errors: string[] = [];

  // 验证必填字段
  if (!config.name?.trim()) {
    errors.push('配置名称不能为空');
  }
  if (!config.provider) {
    errors.push('必须选择模型供应商');
  }
  if (!config.model) {
    errors.push('必须选择模型');
  }

  // 验证参数范围
  if (config.parameters) {
    const { temperature, topP, maxTokens } = config.parameters;

    if (temperature !== undefined) {
      if (temperature < DEFAULT_PARAMETER_RANGES.temperature.min || 
          temperature > DEFAULT_PARAMETER_RANGES.temperature.max) {
        errors.push(`Temperature 必须在 ${DEFAULT_PARAMETER_RANGES.temperature.min} 到 ${DEFAULT_PARAMETER_RANGES.temperature.max} 之间`);
      }
    }

    if (topP !== undefined) {
      if (topP < DEFAULT_PARAMETER_RANGES.topP.min || 
          topP > DEFAULT_PARAMETER_RANGES.topP.max) {
        errors.push(`Top P 必须在 ${DEFAULT_PARAMETER_RANGES.topP.min} 到 ${DEFAULT_PARAMETER_RANGES.topP.max} 之间`);
      }
    }

    if (maxTokens !== undefined) {
      if (maxTokens < DEFAULT_PARAMETER_RANGES.maxTokens.min || 
          maxTokens > DEFAULT_PARAMETER_RANGES.maxTokens.max) {
        errors.push(`最大Token数必须在 ${DEFAULT_PARAMETER_RANGES.maxTokens.min} 到 ${DEFAULT_PARAMETER_RANGES.maxTokens.max} 之间`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function exportModelConfigs(configs: ModelConfig[]): string {
  return JSON.stringify(configs, null, 2);
}

export function importModelConfigs(jsonString: string): { 
  configs: ModelConfig[],
  validationResults: Map<string, ValidationResult>
} {
  try {
    const configs = JSON.parse(jsonString) as ModelConfig[];
    const validationResults = new Map<string, ValidationResult>();

    // 验证每个配置
    configs.forEach(config => {
      validationResults.set(config.name, validateModelConfig(config));
    });

    return {
      configs,
      validationResults
    };
  } catch (error) {
    throw new Error('导入的JSON格式无效');
  }
}

export async function testModelConfig(config: ModelConfig): Promise<ValidationResult> {
  try {
    // 这里可以添加实际的API测试逻辑
    // 目前只是模拟测试
    await new Promise(resolve => setTimeout(resolve, 1000));

    const errors: string[] = [];
    
    // 模拟测试结果
    if (Math.random() > 0.8) {
      errors.push('API连接测试失败');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [(error as Error).message]
    };
  }
} 