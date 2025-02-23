import type { ChatRequest, ChatResponse, TestResult } from '../../api/types';
import { LLMProvider } from './base';
import { LLMError, LLMErrorCode } from '../../types/error';
import type { ModelConfig } from '../../types/config';
import { OllamaAdapter } from '../../adapters/ollama';

export class OllamaProvider extends LLMProvider {
  private config: ModelConfig;
  private initialized: boolean = false;
  private adapter: OllamaAdapter;

  constructor(config: ModelConfig) {
    super();
    this.config = config;
    this.adapter = new OllamaAdapter();
  }

  get name(): string {
    return 'ollama';
  }

  async initialize(skipModelValidation: boolean = false): Promise<void> {
    console.group('=== OllamaProvider.initialize ===');
    console.log('Raw config:', this.config);
    console.log('Auth config:', this.config.auth);
    console.log('Model:', this.config.model);
    console.log('Parameters:', this.config.parameters);
    console.log('Skip model validation:', skipModelValidation);

    try {
      // 验证 auth 对象存在
      if (!this.config.auth) {
        this.config.auth = { 
          baseUrl: 'http://localhost:11434',
          apiKey: '' // Ollama 不需要 API Key，但为了类型兼容性添加空字符串
        };
        console.log('Created default auth config:', this.config.auth);
      }

      // 设置默认 baseUrl，只有当 baseUrl 为空字符串时才设置默认值
      if (!this.config.auth.baseUrl || this.config.auth.baseUrl.trim() === '') {
        this.config.auth.baseUrl = 'http://localhost:11434';
        console.log('Using default baseUrl:', this.config.auth.baseUrl);
      }

      // 验证基本配置
      if (!skipModelValidation && !this.config.model) {
        console.error('Missing model name in config');
        throw new LLMError(
          LLMErrorCode.INVALID_CONFIG,
          this.name,
          new Error('缺少模型名称')
        );
      }

      console.log('Attempting to connect to Ollama server at:', this.config.auth.baseUrl);

      // 验证服务可用性
      try {
        const response = await fetch(`${this.config.auth.baseUrl}/api/version`);
        console.log('Ollama server response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const version = await response.json();
        console.log('Ollama server version:', version);
      } catch (error: unknown) {
        console.error('Failed to connect to Ollama server:', error);
        throw new LLMError(
          LLMErrorCode.INITIALIZATION_FAILED,
          this.name,
          new Error(`无法连接到 Ollama 服务器: ${error instanceof Error ? error.message : String(error)}`)
        );
      }

      this.initialized = true;
      console.log('Initialization successful');
    } catch (error: unknown) {
      console.error('Initialization failed:', error);
      throw new LLMError(
        error instanceof LLMError ? error.code : LLMErrorCode.INITIALIZATION_FAILED,
        this.name,
        error instanceof Error ? error : new Error('初始化失败')
      );
    } finally {
      console.groupEnd();
    }
  }

  private checkInitialized(): void {
    if (!this.initialized) {
      throw new LLMError(
        LLMErrorCode.INITIALIZATION_FAILED,
        this.name,
        new Error('Provider not initialized')
      );
    }
  }

  private async makeRequest(endpoint: string, body: any): Promise<Response> {
    const response = await fetch(`${this.config.auth.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.checkInitialized();

    try {
      const adaptedRequest = this.adapter.adaptRequest(request);
      console.log('Sending request to Ollama:', adaptedRequest);
      
      const response = await fetch(`${this.config.auth.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: adaptedRequest.model,
          prompt: adaptedRequest.messages.map(msg => `${msg.role}: ${msg.content}`).join('\n'),
          stream: false,
          options: adaptedRequest.options
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ollama API error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Ollama API response:', data);
      
      return {
        content: data.response,
        metadata: {
          modelId: data.model,
          provider: this.name,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Chat error:', error);
      throw new LLMError(
        LLMErrorCode.API_ERROR,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  async *stream(request: ChatRequest): AsyncGenerator<ChatResponse> {
    this.checkInitialized();

    try {
      const adaptedRequest = this.adapter.adaptRequest({ ...request, stream: true });
      console.log('Starting stream request to Ollama:', adaptedRequest);
      
      const response = await fetch(`${this.config.auth.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: adaptedRequest.model,
          prompt: adaptedRequest.messages.map(msg => `${msg.role}: ${msg.content}`).join('\n'),
          stream: true,
          options: adaptedRequest.options
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ollama stream error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;

            try {
              const data = JSON.parse(line);
              //console.log('Ollama stream chunk:', data);
              
              yield {
                content: data.response,
                metadata: {
                  modelId: data.model,
                  provider: this.name,
                  timestamp: Date.now()
                }
              };
            } catch (error) {
              console.error('Error parsing stream data:', error);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Stream error:', error);
      throw new LLMError(
        LLMErrorCode.STREAM_ERROR,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  async test(): Promise<TestResult> {
    try {
      await this.initialize();
      const response = await this.chat({
        message: 'test',
        systemPrompt: 'You are a helpful assistant.',
      });
      return {
        success: true,
        latency: 0,
      };
    } catch (error) {
      return {
        success: false,
        latency: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async listModels(): Promise<string[]> {
    try {
      console.log('Fetching models from Ollama server:', `${this.config.auth.baseUrl}/api/tags`);
      
      const response = await fetch(`${this.config.auth.baseUrl}/api/tags`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ollama API error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Raw Ollama API response:', data);
      
      // Ollama API返回的是一个包含models数组的对象
      // 每个model对象包含name属性
      if (data && Array.isArray(data.models)) {
        const modelNames = data.models.map((model: any) => model.name);
        console.log('Extracted model names:', modelNames);
        return modelNames;
      }
      
      // 如果返回格式不是预期的，尝试其他可能的格式
      if (Array.isArray(data)) {
        const modelNames = data.map((model: any) => {
          if (typeof model === 'string') return model;
          return model.name || model.id || model;
        }).filter(Boolean);
        console.log('Extracted model names from array:', modelNames);
        return modelNames;
      }
      
      // 如果是简单对象格式
      if (data && typeof data === 'object') {
        const modelNames = Object.keys(data);
        console.log('Extracted model names from object:', modelNames);
        return modelNames;
      }
      
      console.warn('Unexpected Ollama API response format:', data);
      return [];
    } catch (error) {
      console.error('Failed to list Ollama models:', error);
      throw new LLMError(
        LLMErrorCode.API_ERROR,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  async validateConfig(): Promise<void> {
    if (!this.config.auth.baseUrl) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        this.name,
        new Error('缺少服务地址')
      );
    }

    try {
      const response = await fetch(`${this.config.auth.baseUrl}/api/version`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      throw new LLMError(
        LLMErrorCode.INVALID_CONFIG,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }
}

export default OllamaProvider;
