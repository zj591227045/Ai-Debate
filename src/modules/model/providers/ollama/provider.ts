import { ModelProvider, AuthConfig } from '../../types';

export class OllamaProvider implements ModelProvider {
  id = 'ollama';
  name = 'Ollama';
  defaultBaseUrl = 'http://localhost:11434';
  models = ['llama2', 'mistral', 'mixtral', 'codellama', 'phi'];
  requiresApiKey = false;

  async getAvailableModels(config: Partial<AuthConfig>): Promise<string[]> {
    const baseUrl = config.baseUrl || this.defaultBaseUrl;
    try {
      const response = await fetch(`${baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`获取模型列表失败: ${response.statusText}`);
      }
      const data = await response.json();
      return data.models.map((model: any) => model.name);
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return this.models;
    }
  }

  async validateApiKey(config: Partial<AuthConfig>): Promise<boolean> {
    // Ollama 不需要 API 密钥验证
    return true;
  }

  getHeaders(config: Partial<AuthConfig>): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  getApiEndpoint(config: Partial<AuthConfig>): string {
    return config.baseUrl || this.defaultBaseUrl;
  }
} 