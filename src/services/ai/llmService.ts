import type { AIServiceConfig } from './types';

interface LLMRequestOptions {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  timeout?: number;
}

interface LLMResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class LLMService {
  private config: AIServiceConfig;
  private controller: AbortController;

  constructor(config: AIServiceConfig) {
    //console.log('LLMService 初始化配置:', {
    //  baseURL: config.baseURL,
    //  hasApiKey: !!config.apiKey,
    //  timeout: config.timeout,
    //  maxRetries: config.maxRetries
    //});
    this.config = config;
    this.controller = new AbortController();
  }

  async generate(options: LLMRequestOptions): Promise<LLMResponse> {
    try {
      console.log('准备发送请求:', {
        baseURL: this.config.baseURL,
        method: 'POST',
        hasApiKey: !!this.config.apiKey,
        options: {
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          hasStopSequences: !!options.stopSequences,
          timeout: options.timeout || this.config.timeout
        }
      });

      // 构建完整的 API URL
      const apiUrl = new URL('/api/ai', this.config.baseURL).toString();
      console.log('完整的API URL:', apiUrl);

      // 设置超时控制
      const timeoutId = setTimeout(() => {
        console.log('请求超时，正在中止...');
        this.controller.abort();
      }, options.timeout || this.config.timeout);

      const requestBody = {
        prompt: options.prompt,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        stop: options.stopSequences,
      };

      console.log('请求体:', {
        ...requestBody,
        promptLength: options.prompt.length,
        promptPreview: options.prompt.substring(0, 100) + '...'
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: this.controller.signal
      });

      clearTimeout(timeoutId);

      console.log('收到响应:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API调用失败:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(
          `AI服务调用失败: ${response.statusText}\n${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      console.log('解析响应数据:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasUsage: !!data.usage,
        firstChoiceLength: data.choices?.[0]?.text?.length
      });

      return {
        text: data.choices?.[0]?.text || '',
        usage: data.usage
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error('请求失败:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          isAbortError: error.name === 'AbortError'
        });

        if (error.name === 'AbortError') {
          throw new Error('AI服务请求超时');
        }
        throw new Error(`AI服务错误: ${error.message}`);
      }
      throw error;
    }
  }

  // 取消当前请求
  cancel() {
    console.log('正在取消请求...');
    this.controller.abort();
    this.controller = new AbortController();
  }
}

export const createLLMService = (config: AIServiceConfig) => {
  return new LLMService(config);
}; 