# LLM服务设计文档

## 目录
- [架构设计](#架构设计)
- [数据结构](#数据结构)
- [接口定义](#接口定义)
- [存储设计](#存储设计)
- [实现细节](#实现细节)
- [供应商集成规范](#供应商集成规范)

## 架构设计

### 整体架构
```mermaid
graph TD
    A[辩论室/模型测试] -->|调用| B[LLMServiceManager]
    B -->|创建| C[LLMProvider]
    C -->|实现| D[LLMService接口]
    E[ModelConfigService] -->|配置| B
    F[LocalStorage] -->|持久化| E
```

### 分层设计
1. 应用层
   - 辩论室服务 (AIDebateService)
   - 模型测试面板 (ModelTestPanel)

2. 服务层
   - LLM服务管理器 (LLMServiceManager)
   - 模型配置服务 (ModelConfigService)

3. 提供商层
   - Ollama提供商 (OllamaProvider)
   - Deepseek提供商 (DeepseekProvider)
   - 其他提供商实现

4. 基础设施层
   - 存储服务 (StorageService)
   - 配置管理 (ConfigManager)

## 数据结构

### 1. 基础类型定义
```typescript
// src/modules/llm/types/index.ts

export interface LLMRequest {
  prompt: string;
  input: string;
  modelConfig: ModelConfig;
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stop?: string[];
  };
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface LLMService {
  generateCompletion(request: LLMRequest): Promise<LLMResponse>;
  generateStream?(request: LLMRequest): AsyncIterator<string>;
}

export interface LLMProvider extends LLMService {
  validateConfig(): Promise<boolean>;
  listModels?(): Promise<string[]>;
}
```

### 2. 提供商特定配置
```typescript
// src/modules/llm/types/providers.ts

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
    stop?: string[];
    useLocalEndpoint?: boolean;
  };
}

export interface DeepseekConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  organizationId?: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
}

// ... 其他提供商配置
```

### 3. 错误处理
```typescript
// src/modules/llm/types/error.ts

export enum LLMErrorCode {
  INVALID_CONFIG = 'INVALID_CONFIG',
  API_ERROR = 'API_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export class LLMError extends Error {
  constructor(
    message: string,
    public code: LLMErrorCode,
    public provider: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
```

## 接口定义

### 1. LLM服务管理器
```typescript
// src/modules/llm/services/LLMServiceManager.ts

export class LLMServiceManager {
  private static instance: LLMServiceManager;
  private providerInstances: Map<string, LLMProvider>;
  private modelConfigService: ModelConfigService;

  static getInstance(): LLMServiceManager;
  async getProvider(modelConfig: ModelConfig): Promise<LLMProvider>;
  private createProvider(modelConfig: ModelConfig): Promise<LLMProvider>;
}
```

### 2. 提供商实现
```typescript
// src/modules/llm/providers/ollama/OllamaProvider.ts

export class OllamaProvider implements LLMProvider {
  constructor(private config: OllamaConfig) {}
  
  async generateCompletion(request: LLMRequest): Promise<LLMResponse>;
  async generateStream(request: LLMRequest): AsyncIterator<string>;
  async validateConfig(): Promise<boolean>;
}

// src/modules/llm/providers/deepseek/DeepseekProvider.ts

export class DeepseekProvider implements LLMProvider {
  constructor(private config: DeepseekConfig) {}
  
  async generateCompletion(request: LLMRequest): Promise<LLMResponse>;
  async generateStream(request: LLMRequest): AsyncIterator<string>;
  async validateConfig(): Promise<boolean>;
}
```

## 存储设计

### 1. 模型配置存储
```typescript
// src/modules/llm/storage/types.ts

interface ModelConfigStorage {
  configs: {
    [configId: string]: ModelConfig;
  };
  providers: {
    [providerId: string]: ProviderConfig;
  };
  defaultConfig?: string;
}

// src/modules/llm/storage/ModelConfigService.ts

export class ModelConfigService {
  private storage: StorageService;
  
  async getConfig(id: string): Promise<ModelConfig>;
  async saveConfig(config: ModelConfig): Promise<void>;
  async listConfigs(): Promise<ModelConfig[]>;
  async setDefaultConfig(id: string): Promise<void>;
  async getDefaultConfig(): Promise<ModelConfig | null>;
}
```

### 2. 持久化实现
```typescript
// src/modules/llm/storage/StorageService.ts

export class StorageService {
  private readonly STORAGE_KEY = 'llm_configs';
  
  async load(): Promise<ModelConfigStorage>;
  async save(data: ModelConfigStorage): Promise<void>;
  private validate(data: unknown): asserts data is ModelConfigStorage;
}
```

## 实现细节

### 1. 提供商工厂
```typescript
// src/modules/llm/providers/ProviderFactory.ts

export class ProviderFactory {
  static createProvider(config: ModelConfig): LLMProvider {
    switch (config.provider) {
      case 'ollama':
        return new OllamaProvider(config.providerSpecific as OllamaConfig);
      case 'deepseek':
        return new DeepseekProvider(config.providerSpecific as DeepseekConfig);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }
}
```

### 2. 配置验证
```typescript
// src/modules/llm/validation/schemas.ts

import { z } from 'zod';

export const modelConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  provider: z.enum(['ollama', 'deepseek', /* other providers */]),
  model: z.string(),
  parameters: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).optional(),
    topP: z.number().min(0).max(1).optional()
  }).optional(),
  providerSpecific: z.record(z.any())
});
```

### 3. 错误处理
```typescript
// src/modules/llm/utils/errorHandler.ts

export class LLMErrorHandler {
  static handle(error: unknown, provider: string): LLMError {
    if (error instanceof LLMError) {
      return error;
    }
    
    // 处理不同类型的错误
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return new LLMError(
          'Rate limit exceeded',
          LLMErrorCode.RATE_LIMIT,
          provider,
          error
        );
      }
      // ... 其他错误类型处理
    }
    
    return new LLMError(
      'Unknown error occurred',
      LLMErrorCode.UNKNOWN,
      provider,
      error as Error
    );
  }
}
```

## 使用示例

### 1. 在辩论室中使用
```typescript
// src/modules/debate/services/AIDebateService.ts

export class AIDebateService {
  private llmManager = LLMServiceManager.getInstance();
  
  async generateInnerThoughts(character: Character, state: DebateState) {
    const modelConfig = await this.modelConfigService.getById(character.config.modelId);
    const provider = await this.llmManager.getProvider(modelConfig);
    
    const response = await provider.generateCompletion({
      prompt: this.buildInnerThoughtsPrompt(character, state),
      input: '',
      modelConfig,
      parameters: {
        temperature: 0.8,
        maxTokens: 500
      }
    });
    
    return response.content;
  }
}
```

### 2. 在模型测试中使用
```typescript
// src/modules/model/components/ModelTestPanel.tsx

export const ModelTestPanel: React.FC<Props> = ({ modelConfig }) => {
  const llmManager = LLMServiceManager.getInstance();
  
  const handleTest = async (input: string) => {
    const provider = await llmManager.getProvider(modelConfig);
    const response = await provider.generateCompletion({
      prompt: "You are a helpful assistant.",
      input,
      modelConfig
    });
    // 处理响应...
  };
}
```

## 配置示例

### 1. Ollama配置
```json
{
  "id": "ollama-local",
  "name": "本地Ollama模型",
  "provider": "ollama",
  "model": "deepseek-coder",
  "parameters": {
    "temperature": 0.7,
    "maxTokens": 2000
  },
  "providerSpecific": {
    "baseUrl": "http://localhost:11434",
    "useLocalEndpoint": true
  }
}
```

### 2. Deepseek配置
```json
{
  "id": "deepseek-chat",
  "name": "Deepseek聊天模型",
  "provider": "deepseek",
  "model": "deepseek-chat",
  "parameters": {
    "temperature": 0.8,
    "maxTokens": 1000
  },
  "providerSpecific": {
    "baseUrl": "https://api.deepseek.com/v1",
    "apiKey": "YOUR_API_KEY",
    "organizationId": "YOUR_ORG_ID"
  }
}
```

## 注意事项

1. 配置安全性
   - API密钥等敏感信息需要加密存储
   - 避免在日志中打印敏感信息
   - 定期轮换密钥

2. 错误处理
   - 实现完整的错误追踪
   - 添加重试机制
   - 提供用户友好的错误提示

3. 性能优化
   - 缓存Provider实例
   - 实现请求队列
   - 添加超时处理

4. 可扩展性
   - 保持接口统一
   - 支持动态加载提供商
   - 预留自定义配置空间

## 待优化项目

1. 功能增强
   - [ ] 添加流式输出支持
   - [ ] 实现模型自动选择
   - [ ] 添加响应解析器

2. 性能优化
   - [ ] 添加请求缓存
   - [ ] 优化配置加载
   - [ ] 实现批量请求

3. 监控与日志
   - [ ] 添加性能监控
   - [ ] 完善日志记录
   - [ ] 实现使用统计

## 技术栈

1. 核心技术
   - TypeScript
   - React
   - IndexedDB/LocalStorage
   - WebSocket (流式输出)

2. 工具库
   - Zod (数据验证)
   - Axios (HTTP请求)
   - crypto-js (加密存储)

3. 开发工具
   - ESLint
   - Jest
   - TypeDoc 

## 新提供商实现指南

### 1. 实现步骤

1. 类型定义
```typescript
// 1. 在 src/modules/llm/types/providers.ts 中添加提供商配置接口
export interface NewProviderConfig {
  baseUrl: string;
  apiKey?: string;
  // 其他必要的认证信息
  model: string;
  options?: {
    // 模型特定参数
    temperature?: number;
    maxTokens?: number;
    // 其他可选参数
  };
}

// 2. 在 src/modules/llm/types/common.ts 中更新提供商枚举
export type ModelProvider = 
  | 'ollama'
  | 'deepseek'
  | 'new_provider'  // 添加新提供商
  | string;        // 保持开放性
```

2. 提供商实现
```typescript
// src/modules/llm/providers/new-provider/NewProvider.ts
import { LLMProvider, LLMRequest, LLMResponse } from '../../types';
import { NewProviderConfig } from '../../types/providers';
import { LLMError, LLMErrorCode } from '../../types/error';

export class NewProvider implements LLMProvider {
  private initialized: boolean = false;

  constructor(private config: NewProviderConfig) {}

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 1. 验证配置
      await this.validateConfig();
      
      // 2. 初始化连接
      await this.initializeConnection();
      
      // 3. 测试连接
      await this.testConnection();
      
      this.initialized = true;
    } catch (error) {
      throw new LLMError(
        '初始化失败',
        LLMErrorCode.INITIALIZATION_FAILED,
        'new_provider',
        error as Error
      );
    }
  }

  private async initializeConnection(): Promise<void> {
    // 实现供应商特定的连接初始化逻辑
  }

  private async testConnection(): Promise<void> {
    // 实现连接测试逻辑
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // 1. 转换请求格式
      const apiRequest = this.transformRequest(request);
      
      // 2. 发送API请求
      const apiResponse = await this.sendRequest(apiRequest);
      
      // 3. 转换响应格式
      return this.transformResponse(apiResponse);
    } catch (error) {
      // 4. 错误处理
      throw LLMErrorHandler.handle(error, 'new_provider');
    }
  }

  async generateStream(request: LLMRequest): AsyncIterator<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    // 实现流式输出
    // 如果不支持，可以不实现此方法
  }

  async validateConfig(): Promise<boolean> {
    // 实现配置验证
    if (!this.config.baseUrl) {
      throw new LLMError(
        'Base URL is required',
        LLMErrorCode.INVALID_CONFIG,
        'new_provider'
      );
    }
    // ... 其他验证
    return true;
  }

  private transformRequest(request: LLMRequest): any {
    // 将统一的请求格式转换为提供商特定格式
    return {
      // 根据API文档进行转换
    };
  }

  private transformResponse(apiResponse: any): LLMResponse {
    // 将提供商响应转换为统一格式
    return {
      content: apiResponse.text || '',
      usage: {
        promptTokens: apiResponse.usage?.prompt_tokens || 0,
        completionTokens: apiResponse.usage?.completion_tokens || 0,
        totalTokens: apiResponse.usage?.total_tokens || 0
      },
      metadata: {
        // 保存提供商特定的元数据
        provider: 'new_provider',
        model: this.config.model,
        // ...其他元数据
      }
    };
  }
}
```

3. 工厂注册
```typescript
// 更新 src/modules/llm/providers/ProviderFactory.ts
export class ProviderFactory {
  static createProvider(config: ModelConfig): LLMProvider {
    switch (config.provider) {
      // ... 现有提供商
      case 'new_provider':
        return new NewProvider(config.providerSpecific as NewProviderConfig);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }
}
```

4. 配置验证
```typescript
// 更新 src/modules/llm/validation/schemas.ts
export const newProviderConfigSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
  model: z.string(),
  options: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).optional(),
    // ... 其他参数验证
  }).optional()
});

// 更新 modelConfigSchema
export const modelConfigSchema = z.object({
  // ... 现有字段
  provider: z.enum(['ollama', 'deepseek', 'new_provider']),
  providerSpecific: z.union([
    // ... 现有提供商配置
    newProviderConfigSchema
  ])
});
```

### 2. 测试规范

1. 单元测试
```typescript
// src/modules/llm/providers/new-provider/__tests__/NewProvider.test.ts
describe('NewProvider', () => {
  // 配置验证测试
  describe('validateConfig', () => {
    it('should validate valid config', async () => {
      // ...
    });

    it('should throw on invalid config', async () => {
      // ...
    });
  });

  // 请求转换测试
  describe('transformRequest', () => {
    it('should transform request correctly', () => {
      // ...
    });
  });

  // 响应转换测试
  describe('transformResponse', () => {
    it('should transform response correctly', () => {
      // ...
    });
  });

  // 完整流程测试
  describe('generateCompletion', () => {
    it('should generate completion successfully', async () => {
      // ...
    });

    it('should handle API errors correctly', async () => {
      // ...
    });
  });
});
```

2. 集成测试
```typescript
// src/modules/llm/providers/new-provider/__tests__/integration.test.ts
describe('NewProvider Integration', () => {
  it('should work with LLMServiceManager', async () => {
    // ...
  });

  it('should work with ModelConfigService', async () => {
    // ...
  });
});
```

### 3. 文档要求

1. API文档
- 完整的API参数说明
- 请求/响应示例
- 错误码说明
- 速率限制说明

2. 配置文档
- 必要的配置项说明
- 可选配置项说明
- 配置示例
- 最佳实践建议

3. 使用文档
- 基本使用示例
- 流式输出示例（如果支持）
- 错误处理示例
- 性能优化建议

### 4. 检查清单

实现新提供商时，请确保完成以下检查项：

- [ ] 类型定义完整性
  - [ ] 配置接口定义
  - [ ] 请求/响应类型定义
  - [ ] 错误类型定义

- [ ] 核心功能实现
  - [ ] 基本对话生成
  - [ ] 流式输出（可选）
  - [ ] 配置验证
  - [ ] 错误处理

- [ ] 代码质量
  - [ ] TypeScript 类型完整
  - [ ] 代码注释完善
  - [ ] 遵循项目代码风格
  - [ ] 通过 lint 检查

- [ ] 测试覆盖
  - [ ] 单元测试
  - [ ] 集成测试
  - [ ] 错误场景测试
  - [ ] 性能测试

- [ ] 文档完整性
  - [ ] API 文档
  - [ ] 配置文档
  - [ ] 使用示例
  - [ ] 更新主文档

### 5. 性能考虑

1. 缓存策略
```typescript
export class NewProvider implements LLMProvider {
  private cache: Map<string, LLMResponse>;
  private cacheConfig: {
    enabled: boolean;
    ttl: number;
  };

  constructor(config: NewProviderConfig) {
    this.cache = new Map();
    this.cacheConfig = {
      enabled: config.options?.enableCache ?? false,
      ttl: config.options?.cacheTTL ?? 3600000 // 1小时
    };
  }

  private getCacheKey(request: LLMRequest): string {
    // 生成缓存键
    return JSON.stringify({
      prompt: request.prompt,
      input: request.input,
      model: this.config.model,
      parameters: request.parameters
    });
  }

  private async getFromCache(request: LLMRequest): Promise<LLMResponse | null> {
    if (!this.cacheConfig.enabled) return null;
    const key = this.getCacheKey(request);
    return this.cache.get(key) || null;
  }

  private setCache(request: LLMRequest, response: LLMResponse): void {
    if (!this.cacheConfig.enabled) return;
    const key = this.getCacheKey(request);
    this.cache.set(key, response);
    
    // 设置 TTL
    setTimeout(() => {
      this.cache.delete(key);
    }, this.cacheConfig.ttl);
  }
}
```

2. 重试机制
```typescript
export class NewProvider implements LLMProvider {
  private async withRetry<T>(
    operation: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries === 0 || !this.isRetryableError(error)) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.withRetry(operation, retries - 1, delay * 2);
    }
  }

  private isRetryableError(error: any): boolean {
    // 判断错误是否可重试
    return error instanceof LLMError && 
           (error.code === LLMErrorCode.RATE_LIMIT ||
            error.code === LLMErrorCode.TIMEOUT);
  }
}
```

3. 并发控制
```typescript
export class NewProvider implements LLMProvider {
  private semaphore: Semaphore;

  constructor(config: NewProviderConfig) {
    this.semaphore = new Semaphore(config.options?.maxConcurrent ?? 5);
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    return this.semaphore.acquire(async () => {
      // 原有的生成逻辑
    });
  }
}
```

### 6. 监控与日志

1. 性能监控
```typescript
export class NewProvider implements LLMProvider {
  private metrics = {
    requestCount: 0,
    errorCount: 0,
    totalLatency: 0,
    tokenUsage: 0
  };

  private async trackMetrics<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await operation();
      this.metrics.requestCount++;
      this.metrics.totalLatency += Date.now() - startTime;
      return result;
    } catch (error) {
      this.metrics.errorCount++;
      throw error;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      averageLatency: this.metrics.totalLatency / this.metrics.requestCount,
      errorRate: this.metrics.errorCount / this.metrics.requestCount
    };
  }
}
```

2. 日志记录
```typescript
export class NewProvider implements LLMProvider {
  private logger: Logger;

  constructor(config: NewProviderConfig) {
    this.logger = new Logger('NewProvider');
  }

  private logRequest(request: LLMRequest): void {
    this.logger.debug('Request', {
      prompt: request.prompt.substring(0, 100),
      model: this.config.model,
      parameters: request.parameters
    });
  }

  private logResponse(response: LLMResponse): void {
    this.logger.debug('Response', {
      contentLength: response.content.length,
      usage: response.usage
    });
  }

  private logError(error: Error): void {
    this.logger.error('Error', {
      message: error.message,
      stack: error.stack,
      code: error instanceof LLMError ? error.code : 'UNKNOWN'
    });
  }
}
``` 

## 开发进度记录

### 当前开发状态
- 开始时间: 2024-02-06
- 当前阶段: 供应商适配器实现中
- 最近更新: 2024-02-06
- 完成度: 40%

### 更新日志
- 2024-02-06: 完成基础类型定义，包括LLMRequest、LLMResponse、供应商配置和错误处理类型
- 2024-02-06: 完成中间层服务实现，包括UnifiedLLMService和ProviderManager
- 2024-02-06: 完成基础适配器接口和抽象类，实现Ollama适配器
- 2024-02-06: 实现Deepseek适配器
- 2024-02-06: 实现火山引擎适配器

### 1. 基础类型定义 [已完成]
- [x] 创建 src/modules/llm/types/index.ts
  - [x] 定义 LLMRequest 接口
  - [x] 定义 LLMResponse 接口
  - [x] 定义 LLMError 类型
  - [x] 定义 LLMParameters 类型
- [x] 创建 src/modules/llm/types/providers.ts
  - [x] 定义各供应商配置接口
  - [x] 定义供应商类型枚举
  - [x] 定义供应商工厂接口

### 2. 中间层服务实现 [已完成]
- [x] 创建 src/modules/llm/services/UnifiedLLMService.ts
  - [x] 实现统一的LLM服务类
  - [x] 实现请求格式化方法
  - [x] 实现响应格式化方法
  - [x] 实现错误处理机制
- [x] 创建 src/modules/llm/services/ProviderManager.ts
  - [x] 实现供应商实例管理
  - [x] 实现供应商配置验证
  - [x] 实现供应商创建与缓存

### 3. 供应商适配器实现 [进行中]
- [x] 创建 src/modules/llm/adapters/base.ts
  - [x] 定义基础适配器接口
  - [x] 实现通用适配器方法
- [ ] 创建各供应商适配器
  - [x] Ollama适配器
  - [x] Deepseek适配器
  - [x] Volcengine适配器
  - [ ] 其他供应商适配器

### 4. 配置管理优化 [待开始]
- [ ] 更新 ModelConfigService
  - [ ] 增强配置验证逻辑
  - [ ] 添加供应商特定配置支持
  - [ ] 优化配置存储结构
- [ ] 创建配置验证
  - [ ] 实现供应商配置验证schema
  - [ ] 实现配置迁移方法

### 5. 错误处理与日志 [待开始]
- [ ] 创建错误处理模块
  - [ ] 定义错误类型
  - [ ] 实现错误转换方法
  - [ ] 实现错误处理工具
- [ ] 创建日志模块
  - [ ] 实现日志记录服务
  - [ ] 添加性能监控
  - [ ] 添加错误追踪

### 6. 测试用例编写 [待开始]
- [ ] 单元测试
  - [ ] UnifiedLLMService测试
  - [ ] 供应商适配器测试
  - [ ] 配置验证测试
- [ ] 集成测试
  - [ ] 完整调用流程测试
  - [ ] 错误处理测试
  - [ ] 性能测试

### 7. 应用集成 [待开始]
- [ ] 更新辩论室服务
  - [ ] 修改 AIDebateService
  - [ ] 集成新的UnifiedLLMService
  - [ ] 更新错误处理
- [ ] 更新模型测试对话框
  - [ ] 修改 ModelTestDialog
  - [ ] 集成新的UnifiedLLMService
  - [ ] 优化UI交互

### 8. 文档编写 [待开始]
- [ ] API文档
  - [ ] 服务接口文档
  - [ ] 配置说明文档
  - [ ] 错误代码文档
- [ ] 开发指南
  - [ ] 新增供应商指南
  - [ ] 配置管理指南
  - [ ] 最佳实践指南

### 9. 性能优化 [待开始]
- [ ] 实现缓存机制
  - [ ] 响应缓存
  - [ ] 供应商实例缓存
  - [ ] 配置缓存
- [ ] 添加性能监控
  - [ ] 请求耗时统计
  - [ ] 资源使用监控
  - [ ] 性能报告生成

### 10. 迁移计划 [待开始]
- [ ] 准备工作
  - [ ] 创建新的分支
  - [ ] 备份现有配置
  - [ ] 准备回滚方案
- [ ] 迁移步骤
  - [ ] 逐步替换现有调用
  - [ ] 验证功能正确性
  - [ ] 性能对比测试

## 供应商集成规范

### 添加新供应商的步骤

1. 类型定义
   - 在 `src/modules/llm/types/providers.ts` 中的 `ProviderType` 枚举添加新供应商
   - 定义供应商特定的配置接口（如有需要）

2. 适配器实现
   - 在 `src/modules/llm/adapters` 目录下创建新的适配器文件
   - 实现 `BaseProviderAdapter` 的所有必需方法
   - 确保正确实现 `ModelCapabilities` 接口

3. 注册供应商
   - 在 `src/modules/llm/services/initializeProviders.ts` 中注册新供应商
   - 在 `src/modules/llm/adapters/index.ts` 中导出新适配器

4. UI组件
   - 在 `src/modules/model/components/providers` 目录下添加配置表单组件
   - 在 `ProviderSelect` 组件中添加新供应商选项

### 关键检查点

1. 类型系统集成
   ```typescript
   // 1. 在 ProviderType 中添加
   export enum ProviderType {
     // ... 其他供应商
     NEW_PROVIDER = 'new_provider'
   }

   // 2. 添加供应商特定配置（如需要）
   export interface NewProviderConfig extends BaseProviderConfig {
     // 特定配置项
   }
   ```

2. 适配器实现要点
   - 实现所有必需的接口方法
   - 正确处理错误情况
   - 实现合适的类型转换

3. 注册流程
   ```typescript
   // 在 initializeProviders.ts 中
   ProviderManager.getInstance().registerProvider(
     ProviderType.NEW_PROVIDER,
     new NewProviderAdapter()
   );
   ```

### 常见问题处理

1. 供应商类型不支持
   - 确保在 `ProviderType` 枚举中添加了新供应商
   - 确保在 `initializeProviders.ts` 中正确注册
   - 检查拼写和大小写是否一致

2. 类型错误
   - 确保实现了所有必需的接口方法
   - 检查返回类型是否符合接口定义
   - 验证 `ModelCapabilities` 的实现是否正确

3. 运行时错误
   - 实现适当的错误处理
   - 添加详细的日志记录
   - 提供清晰的错误信息