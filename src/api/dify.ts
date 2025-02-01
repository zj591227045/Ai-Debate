import { DifyConfig, DifyResponse, WorkflowConfig, WorkflowResult } from '../types/dify';
import { DifyWorkflowInputs, DifyWorkflowOutputs, InnerThoughtInputs, SpeechInputs, ScoringInputs } from '../types/workflow';
import { ModelConfig, ModelParameters, ModelProvider, PRESET_MODELS } from '../types/model';

export class DifyAPI {
  private config: DifyConfig;
  private baseUrl: string;
  private modelConfig: ModelConfig;

  constructor(config: DifyConfig, modelConfig: ModelConfig) {
    this.config = config;
    this.baseUrl = config.apiEndpoint.replace(/\/$/, '');
    this.modelConfig = modelConfig;
  }

  // 创建请求头
  private createHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    };

    // 添加自定义模型的请求头
    if (this.modelConfig.provider === 'custom' && this.modelConfig.customConfig?.headers) {
      Object.assign(headers, this.modelConfig.customConfig.headers);
    }

    return headers;
  }

  // 获取模型API端点
  private getModelEndpoint(): string {
    if (this.modelConfig.apiEndpoint) {
      return this.modelConfig.apiEndpoint;
    }

    const provider = this.modelConfig.provider;
    if (provider === 'custom') {
      throw new Error('自定义模型必须提供API端点');
    }

    return PRESET_MODELS[provider].endpoints.default;
  }

  // 验证模型配置
  private validateModelConfig() {
    const { provider, modelName } = this.modelConfig;
    
    if (provider === 'custom') {
      if (!this.modelConfig.customConfig) {
        throw new Error('自定义模型必须提供customConfig');
      }
      return;
    }

    const presetConfig = PRESET_MODELS[provider];
    if (!presetConfig.models.includes(modelName)) {
      throw new Error(`不支持的模型: ${modelName}`);
    }
  }

  // 处理API响应
  private async handleResponse<T>(response: Response): Promise<DifyResponse<T>> {
    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: response.status.toString(),
          message: data.message || '请求失败',
        },
      };
    }
    return {
      success: true,
      data: data as T,
    };
  }

  // 执行工作流
  async executeWorkflow<T extends keyof DifyWorkflowOutputs>(
    config: WorkflowConfig & { type: T }
  ): Promise<WorkflowResult<DifyWorkflowOutputs[T]>> {
    try {
      // 验证模型配置
      this.validateModelConfig();

      const response = await fetch(`${this.baseUrl}/applications/${this.config.applicationId}/workflows`, {
        method: 'POST',
        headers: this.createHeaders(),
        body: JSON.stringify({
          type: config.type,
          inputs: config.inputs,
          model: {
            provider: this.modelConfig.provider,
            name: this.modelConfig.modelName,
            parameters: this.modelConfig.customConfig?.modelParameters,
          },
        }),
      });

      const result = await this.handleResponse<DifyWorkflowOutputs[T]>(response);
      
      return {
        id: Date.now().toString(),
        type: config.type,
        status: result.success ? 'completed' : 'failed',
        startTime: new Date(),
        endTime: new Date(),
        result: result.data,
        error: result.error && {
          ...result.error,
          retryable: true,
        },
      };
    } catch (error) {
      return {
        id: Date.now().toString(),
        type: config.type,
        status: 'failed',
        startTime: new Date(),
        endTime: new Date(),
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : '网络错误',
          retryable: true,
        },
      };
    }
  }

  // 更新模型配置
  updateModelConfig(newConfig: Partial<ModelConfig>) {
    this.modelConfig = { ...this.modelConfig, ...newConfig };
    this.validateModelConfig();
  }

  // 内心OS工作流
  async executeInnerThoughtWorkflow(
    inputs: InnerThoughtInputs
  ): Promise<WorkflowResult<DifyWorkflowOutputs['innerThought']>> {
    return this.executeWorkflow({
      type: 'innerThought',
      inputs: { innerThought: inputs, speech: {} as SpeechInputs, scoring: {} as ScoringInputs },
    });
  }

  // 发言工作流
  async executeSpeechWorkflow(
    inputs: SpeechInputs
  ): Promise<WorkflowResult<DifyWorkflowOutputs['speech']>> {
    return this.executeWorkflow({
      type: 'speech',
      inputs: { speech: inputs, innerThought: {} as InnerThoughtInputs, scoring: {} as ScoringInputs },
    });
  }

  // 评分工作流
  async executeScoringWorkflow(
    inputs: ScoringInputs
  ): Promise<WorkflowResult<DifyWorkflowOutputs['scoring']>> {
    return this.executeWorkflow({
      type: 'scoring',
      inputs: { scoring: inputs, innerThought: {} as InnerThoughtInputs, speech: {} as SpeechInputs },
    });
  }
} 