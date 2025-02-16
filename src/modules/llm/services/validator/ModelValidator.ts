import { LLMError, LLMErrorCode } from '../../types/error';
import type { ModelConfig, ModelParameters, AuthConfig } from '../../../model/types';

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ParameterValidationRules<T = any> {
  [key: string]: ValidationRule<T>[];
}

type ModelParameterRules = {
  [K in keyof ModelParameters]: ValidationRule<ModelParameters[K]>[];
};

type ProviderAuthRules = {
  [K in keyof AuthConfig]?: ValidationRule<AuthConfig[K]>[];
};

export class ModelValidator {
  // 基础参数验证规则
  private static baseRules: ModelParameterRules = {
    temperature: [
      {
        validate: (value: number) => typeof value === 'number' && value >= 0 && value <= 2,
        message: "温度参数必须在0-2之间"
      }
    ],
    maxTokens: [
      {
        validate: (value: number) => typeof value === 'number' && value > 0 && value <= 8192,
        message: "最大token数必须在1-8192之间"
      }
    ],
    topP: [
      {
        validate: (value: number) => typeof value === 'number' && value >= 0 && value <= 1,
        message: "topP参数必须在0-1之间"
      }
    ]
  };

  // 供应商特定规则
  private static providerRules: Record<string, ProviderAuthRules> = {
    ollama: {
      baseUrl: [
        {
          validate: (value: string | undefined): boolean => 
            typeof value === 'string' && /^https?:\/\/.+/.test(value),
          message: "Ollama baseUrl必须是有效的URL"
        }
      ]
    },
    siliconflow: {
      apiKey: [
        {
          validate: (value: string | undefined): boolean => 
            typeof value === 'string' && value.length > 0,
          message: "硅基流动API Key不能为空"
        }
      ]
    },
    deepseek: {
      apiKey: [
        {
          validate: (value: string | undefined): boolean => 
            typeof value === 'string' && value.length > 0,
          message: "Deepseek API Key不能为空"
        }
      ]
    }
  };

  static validateConfig(config: ModelConfig): ValidationResult {
    const errors: ValidationError[] = [];

    // 验证基本字段
    if (!config) {
      return {
        isValid: false,
        errors: [{ field: 'config', message: '配置对象不能为空' }]
      };
    }

    if (!config.provider) {
      errors.push({
        field: 'provider',
        message: '供应商不能为空'
      });
    }

    if (!config.model) {
      errors.push({
        field: 'model',
        message: '模型名称不能为空'
      });
    }

    // 验证基础参数
    if (config.parameters) {
      (Object.entries(this.baseRules) as [keyof ModelParameters, ValidationRule[]][]).forEach(([param, rules]) => {
        const value = config.parameters[param];
        if (value !== undefined) { // 只验证已设置的参数
          rules.forEach(rule => {
            if (!rule.validate(value)) {
              errors.push({
                field: `parameters.${param}`,
                message: rule.message
              });
            }
          });
        }
      });
    }

    // 验证供应商特定参数
    if (config.provider && this.providerRules[config.provider]) {
      const providerSpecificRules = this.providerRules[config.provider];
      (Object.entries(providerSpecificRules) as [keyof AuthConfig, ValidationRule[]][]).forEach(([param, rules]) => {
        const value = config.auth?.[param];
        if (value !== undefined) {
          rules.forEach(rule => {
            if (!rule.validate(value)) {
              errors.push({
                field: `auth.${param}`,
                message: rule.message
              });
            }
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateProvider(provider: string): ValidationError | null {
    if (!this.providerRules[provider]) {
      return {
        field: 'provider',
        message: `不支持的供应商: ${provider}`
      };
    }
    return null;
  }

  static getProviderRequiredFields(provider: string): string[] {
    const rules = this.providerRules[provider];
    if (!rules) {
      return [];
    }
    return Object.keys(rules);
  }
} 