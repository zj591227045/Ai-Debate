import { ModelProvider, AuthConfig } from '../../types';

interface DeepseekModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    owned_by: string;
  }>;
}

export class DeepseekProvider implements ModelProvider {
  id = 'deepseek';
  name = 'Deepseek';
  defaultBaseUrl = 'https://api.deepseek.com';
  models = ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'];  // 默认模型列表作为后备
  requiresApiKey = true;

  async getAvailableModels(config: Partial<AuthConfig>): Promise<string[]> {
    if (!config.apiKey) {
      return this.models;
    }

    try {
      const response = await fetch(`${this.defaultBaseUrl}/models`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`获取模型列表失败: ${response.statusText}`);
      }

      const data = await response.json() as DeepseekModelResponse;
      const models = data.data.map(model => model.id);

      // 如果获取到的模型列表为空，使用默认列表
      return models.length > 0 ? models : this.models;
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return this.models;
    }
  }

  async validateApiKey(config: Partial<AuthConfig>): Promise<boolean> {
    if (!config.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.defaultBaseUrl}/models`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('验证 API 密钥失败:', error);
      return false;
    }
  }

  getHeaders(config: Partial<AuthConfig>): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    };
  }

  getApiEndpoint(config: Partial<AuthConfig>): string {
    return config.baseUrl || this.defaultBaseUrl;
  }
} 