# AI模型供应商实现文档

## 1. 目录结构
```
src/
  ├── modules/
  │   ├── model/
  │   │   ├── components/
  │   │   │   ├── providers/
  │   │   │   │   ├── OllamaTestDialog.tsx    # Ollama测试对话组件
  │   │   │   │   └── DeepseekTestDialog.tsx  # Deepseek测试对话组件
  │   │   │   └── ModelTestDialog/
  │   │   │       ├── index.tsx               # 通用测试对话组件
  │   │   │       └── styles.css              # 对话组件样式
  │   │   ├── services/
  │   │   │   ├── providerFactory.ts          # 供应商工厂类
  │   │   │   └── providers/
  │   │   │       ├── ollama/
  │   │   │       │   ├── provider.ts         # Ollama供应商实现
  │   │   │       │   └── types.ts            # Ollama类型定义
  │   │   │       └── deepseek/
  │   │   │           ├── provider.ts         # Deepseek供应商实现
  │   │   │           └── types.ts            # Deepseek类型定义
  │   │   └── types/
  │   │       └── common.ts                   # 通用类型定义
```

## 2. 接口定义

### 2.1 通用接口
```typescript
// src/modules/model/types/common.ts
interface ModelConfig {
  provider: string;
  model: string;
  name: string;
  auth: {
    apiKey?: string;
    baseUrl?: string;
    organizationId?: string;
  };
  parameters: {
    temperature: number;
    topP: number;
    maxTokens: number;
  };
  providerSpecific?: Record<string, any>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  reasoning_content?: string;
}
```

### 2.2 Deepseek接口
```typescript
// src/modules/model/services/providers/deepseek/types.ts
interface DeepseekProviderSpecific {
  model: string;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

interface DeepseekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
      reasoning_content?: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DeepseekStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
      reasoning_content?: string;
    };
    finish_reason: string | null;
  }[];
}
```

### 2.3 Ollama接口
```typescript
// src/modules/model/services/providers/ollama/types.ts
interface OllamaProviderSpecific {
  model: string;
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
  };
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
  eval_count?: number;
}
```

## 3. 核心实现

### 3.1 供应商工厂类
```typescript
// src/modules/model/services/providerFactory.ts
class ProviderFactory {
  private providers: Map<string, typeof BaseProvider> = new Map();

  register(name: string, provider: typeof BaseProvider) {
    this.providers.set(name, provider);
  }

  async createProvider(name: string, config: ApiConfig): Promise<BaseProvider> {
    const Provider = this.providers.get(name);
    if (!Provider) {
      throw new Error(`未找到供应商: ${name}`);
    }
    const provider = new Provider();
    await provider.initialize(config);
    return provider;
  }
}
```

### 3.2 Deepseek供应商实现
```typescript
// src/modules/model/services/providers/deepseek/provider.ts
export class DeepseekProvider extends BaseProvider {
  private config: DeepseekConfig;
  private baseURL: string = 'https://api.deepseek.com/v1';

  async initialize(config: ApiConfig): Promise<void> {
    const deepseekConfig = config.providerSpecific?.deepseek as DeepseekProviderSpecific;
    if (!deepseekConfig?.model) {
      throw new Error('缺少 Deepseek 模型配置');
    }
    this.config = {
      apiKey: config.apiKey,
      organization: config.organizationId,
      baseURL: config.endpoint || this.baseURL,
      defaultModel: deepseekConfig.model,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    };
  }

  async generateCompletionStream(
    messages: Message[],
    parameters: ModelParameters
  ): AsyncGenerator<Message, void, unknown> {
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...(this.config.organization && {
          'X-Organization': this.config.organization
        })
      },
      body: JSON.stringify({
        model: this.config.defaultModel,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: true,
        ...parameters
      })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data) as DeepseekStreamResponse;
            const { choices } = parsed;
            if (choices && choices[0]) {
              const { delta } = choices[0];
              if (delta.content || delta.reasoning_content) {
                yield {
                  role: 'assistant',
                  content: delta.content || '',
                  ...(delta.reasoning_content && {
                    reasoning_content: delta.reasoning_content
                  })
                };
              }
            }
          } catch (e) {
            console.error('解析响应失败:', e);
          }
        }
      }
    }
  }

  async checkBalance(): Promise<number> {
    const response = await fetch(`${this.config.baseURL}/user/balance`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...(this.config.organization && {
          'X-Organization': this.config.organization
        })
      }
    });

    if (!response.ok) {
      throw new Error('获取余额失败');
    }

    const data = await response.json();
    return data.balance;
  }
}
```

### 3.3 Ollama供应商实现
```typescript
// src/modules/model/services/providers/ollama/provider.ts
export class OllamaProvider extends BaseProvider {
  private config: OllamaConfig;

  async initialize(config: ApiConfig): Promise<void> {
    const ollamaConfig = config.providerSpecific?.ollama;
    if (!ollamaConfig?.model) {
      throw new Error('缺少 Ollama 模型配置');
    }
    this.config = {
      baseURL: config.endpoint || 'http://localhost:11434',
      defaultModel: ollamaConfig.model,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    };
  }

  async generateCompletionStream(
    messages: Message[],
    parameters: ModelParameters
  ): AsyncGenerator<Message, void, unknown> {
    const response = await fetch(`${this.config.baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.defaultModel,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: true,
        options: {
          temperature: parameters.temperature,
          top_p: parameters.topP,
          num_predict: parameters.maxTokens
        }
      })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line) continue;

        try {
          const parsed = JSON.parse(line) as OllamaResponse;
          if (parsed.response) {
            yield {
              role: 'assistant',
              content: parsed.response
            };
          }
        } catch (e) {
          console.error('解析响应失败:', e);
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.config.baseURL}/api/tags`);
    if (!response.ok) {
      throw new Error('获取模型列表失败');
    }
    const data = await response.json();
    return data.models || [];
  }
}
```

## 4. 测试对话组件

### 4.1 通用测试对话组件
```typescript
// src/modules/model/components/ModelTestDialog/index.tsx
// 见原文件实现
```

### 4.2 Deepseek测试对话组件
```typescript
// src/modules/model/components/providers/DeepseekTestDialog.tsx
// 继承自通用测试对话组件，添加思考过程显示功能
```

### 4.3 Ollama测试对话组件
```typescript
// src/modules/model/components/providers/OllamaTestDialog.tsx
// 继承自通用测试对话组件，添加本地模型支持
```

## 5. 样式定义
```css
// src/modules/model/components/ModelTestDialog/styles.css
// 见原文件实现
```

## 6. 错误处理

### 6.1 错误类型
```typescript
interface ProviderError extends Error {
  code: string;
  retryable: boolean;
}

interface APIError extends ProviderError {
  status: number;
  response?: any;
}

interface StreamError extends ProviderError {
  phase: 'connection' | 'streaming' | 'parsing';
  recoverable: boolean;
}
```

### 6.2 错误处理策略
```typescript
interface ErrorHandlingStrategy {
  // API错误重试
  retryStrategy: {
    maxAttempts: number;
    backoffFactor: number;
    initialDelay: number;
  };

  // 流式错误恢复
  streamRecovery: {
    maxReconnectAttempts: number;
    reconnectDelay: number;
    bufferSize: number;
  };

  // 降级策略
  fallback: {
    enabled: boolean;
    alternativeProvider?: string;
    timeout: number;
  };
}
```

## 7. 性能优化

### 7.1 缓存策略
```typescript
interface CacheStrategy {
  // 响应缓存
  responseCache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };

  // 模型配置缓存
  configCache: {
    enabled: boolean;
    ttl: number;
  };

  // 连接池
  connectionPool: {
    maxSize: number;
    timeout: number;
    idleTimeout: number;
  };
}
```

### 7.2 并发控制
```typescript
interface ConcurrencyControl {
  // 请求限流
  rateLimit: {
    maxRequests: number;
    interval: number;
    burstSize: number;
  };

  // 并发限制
  concurrency: {
    maxConcurrent: number;
    queueSize: number;
    timeout: number;
  };
}
``` 