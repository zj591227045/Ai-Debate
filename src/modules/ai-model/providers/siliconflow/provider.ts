import { ModelProvider } from '../../types/providers';
import { ApiConfig } from '../../types/config';
import { Message, ModelParameters, ModelResponse, ModelCapabilities } from '../../types/common';

interface SiliconFlowConfig {
  apiKey: string;
  baseURL: string;
  organizationId?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
}

interface SiliconFlowProviderSpecific {
  organizationId?: string;
  model?: string;
}

export class SiliconFlowProvider implements ModelProvider {
  private config: SiliconFlowConfig | null = null;
  private initialized = false;

  async initialize(config: ApiConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('API密钥未配置');
    }

    const providerSpecific = config.providerSpecific as SiliconFlowProviderSpecific;

    this.config = {
      apiKey: config.apiKey,
      baseURL: config.endpoint || 'https://api.siliconflow.cn/v1',
      organizationId: providerSpecific?.organizationId,
      defaultModel: providerSpecific?.model,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3
    };

    this.initialized = true;
  }

  async validateApiKey(): Promise<boolean> {
    if (!this.initialized || !this.config) {
      throw new Error('供应商未初始化');
    }

    try {
      await this.listModels();
      return true;
    } catch (error) {
      throw new Error(`配置验证失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async listModels(): Promise<string[]> {
    if (!this.initialized || !this.config) {
      throw new Error('供应商未初始化');
    }

    try {
      const response = await fetch(`${this.config.baseURL}/models?type=text`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...(this.config.organizationId ? {
            'X-Organization': this.config.organizationId
          } : {})
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`获取模型列表失败: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      if (data.object === 'list' && Array.isArray(data.data)) {
        return data.data
          .filter((model: any) => model.object === 'model')
          .map((model: any) => model.id);
      }

      throw new Error('无效的模型列表响应格式');
    } catch (error) {
      throw new Error(`获取模型列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async generateCompletion(messages: Message[], parameters?: ModelParameters): Promise<ModelResponse> {
    if (!this.initialized || !this.config) {
      throw new Error('供应商未初始化');
    }

    const payload = {
      model: this.config.defaultModel,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: parameters?.temperature,
      top_p: parameters?.topP,
      max_tokens: parameters?.maxTokens
    };

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...(this.config.organizationId ? {
            'X-Organization': this.config.organizationId
          } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`生成回复失败: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        },
        metadata: {
          model: data.model,
          finishReason: data.choices[0].finish_reason
        }
      };
    } catch (error) {
      throw new Error(`生成回复失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async *generateCompletionStream(messages: Message[], parameters?: ModelParameters): AsyncGenerator<ModelResponse> {
    throw new Error('暂不支持流式输出');
  }

  countTokens(text: string): number {
    throw new Error('暂不支持计算Token');
  }

  getCapabilities(): ModelCapabilities {
    return {
      streaming: false,
      functionCalling: false,
      maxContextTokens: 16000,
      maxResponseTokens: 4096,
      multipleCompletions: false
    };
  }
} 