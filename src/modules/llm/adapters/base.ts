/**
 * LLM供应商适配器基础类型
 */

import { 
  LLMRequest, 
  LLMResponse, 
  LLMProvider,
  ModelConfig,
  ModelParameters,
  BaseProviderConfig 
} from '../types';
import { LLMError, LLMErrorCode } from '../types/error';

/**
 * 供应商适配器接口
 */
export interface ProviderAdapter extends LLMProvider {
  initialize(config: BaseProviderConfig, skipModelValidation?: boolean): Promise<void>;
  getProviderName(): string;
}

/**
 * 基础适配器抽象类
 */
export abstract class BaseProviderAdapter<T extends BaseProviderConfig> implements ProviderAdapter {
  protected config: T | null = null;

  /**
   * 初始化适配器
   */
  public async initialize(config: BaseProviderConfig, skipModelValidation?: boolean): Promise<void> {
    this.config = config as T;
    await this.validateConfig(skipModelValidation);
  }

  /**
   * 生成完成响应
   */
  public async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    try {
      // 1. 验证配置
      if (!this.config) {
        throw new LLMError(
          '适配器未初始化',
          LLMErrorCode.INVALID_CONFIG,
          this.getProviderName()
        );
      }

      // 2. 转换请求
      const apiRequest = await this.transformRequest(request);

      // 3. 调用API
      const apiResponse = await this.callApi(apiRequest);

      // 4. 转换响应
      return await this.transformResponse(apiResponse);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 生成流式响应
   */
  public async *generateStream(request: LLMRequest): AsyncGenerator<string> {
    try {
      // 1. 验证配置
      if (!this.config) {
        throw new LLMError(
          '适配器未初始化',
          LLMErrorCode.INVALID_CONFIG,
          this.getProviderName()
        );
      }

      // 2. 转换请求，确保必需的参数存在
      const streamRequest = {
        ...request,
        parameters: {
          temperature: request.parameters?.temperature ?? 0.7,
          maxTokens: request.parameters?.maxTokens ?? 2000,
          topP: request.parameters?.topP ?? 1,
          stream: true,
          // 可选参数保持原样
          ...(request.parameters?.frequencyPenalty !== undefined && { 
            frequencyPenalty: request.parameters.frequencyPenalty 
          }),
          ...(request.parameters?.presencePenalty !== undefined && { 
            presencePenalty: request.parameters.presencePenalty 
          }),
          ...(request.parameters?.stop !== undefined && { 
            stop: request.parameters.stop 
          }),
        } as ModelParameters
      };

      const apiRequest = await this.transformRequest(streamRequest);

      // 3. 调用流式API
      const stream = await this.callStreamApi(apiRequest);

      // 4. 转换并yield每个响应块
      for await (const chunk of stream) {
        const response = await this.transformStreamResponse(chunk);
        yield response;
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 验证配置
   */
  public async validateConfig(skipModelValidation?: boolean): Promise<boolean> {
    try {
      if (!this.config) {
        throw new LLMError(
          '适配器未初始化',
          LLMErrorCode.INVALID_CONFIG,
          this.getProviderName()
        );
      }

      await this.validateProviderConfig(this.config, skipModelValidation);
      return true;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 列出可用模型
   */
  public async listModels(): Promise<string[]> {
    try {
      if (!this.config) {
        throw new LLMError(
          '适配器未初始化',
          LLMErrorCode.INVALID_CONFIG,
          this.getProviderName()
        );
      }

      return await this.fetchAvailableModels();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 获取供应商名称
   */
  public abstract getProviderName(): string;

  /**
   * 验证供应商特定配置
   */
  protected abstract validateProviderConfig(config: T, skipModelValidation?: boolean): Promise<void>;

  /**
   * 转换请求为供应商格式
   */
  protected abstract transformRequest(request: LLMRequest): Promise<any>;

  /**
   * 转换响应为统一格式
   */
  protected abstract transformResponse(response: any): Promise<LLMResponse>;

  /**
   * 转换流式响应块
   */
  protected abstract transformStreamResponse(chunk: any): Promise<string>;

  /**
   * 调用供应商API
   */
  protected abstract callApi(request: any): Promise<any>;

  /**
   * 调用供应商流式API
   */
  protected abstract callStreamApi(request: any): Promise<AsyncIterable<any>>;

  /**
   * 获取可用模型列表
   */
  protected abstract fetchAvailableModels(): Promise<string[]>;

  /**
   * 处理错误
   */
  protected handleError(error: unknown): LLMError {
    if (error instanceof LLMError) {
      return error;
    }

    return new LLMError(
      error instanceof Error ? error.message : '未知错误',
      LLMErrorCode.UNKNOWN,
      this.getProviderName(),
      error instanceof Error ? error : undefined
    );
  }
} 