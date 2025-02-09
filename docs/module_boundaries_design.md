# 模块边界设计方案

## 1. 背景与目标

### 1.1 当前问题
- 不同页面/功能间的方法冲突
- 类型定义重复和冲突
- 属性命名冲突
- 模块间耦合度高
- 代码维护困难

### 1.2 设计目标
- 实现模块间的强制隔离
- 规范化模块间的通信
- 提高代码可维护性
- 减少模块间的冲突
- 便于后续功能扩展

## 2. 模块划分

### 2.1 核心模块

1. **LLM Service 模块** (@llm)
```
src/modules/llm/
├── api/                    # 对外暴露的API
│   ├── index.ts           # 统一导出
│   ├── types.ts           # API类型定义
│   └── events.ts          # 事件定义
├── services/              # 核心服务
│   ├── UnifiedLLMService.ts
│   └── provider/          # 不同供应商的实现
│       ├── base.ts        # 基础接口
│       ├── ollama.ts      # Ollama实现
│       ├── openai.ts      # OpenAI实现
│       └── deepseek.ts    # Deepseek实现
├── types/                 # 内部类型定义
│   ├── config.ts         # 配置类型
│   ├── response.ts       # 响应类型
│   └── error.ts          # 错误类型
├── adapters/              # 适配器
│   ├── index.ts          # 适配器导出
│   └── provider/         # 供应商适配器
└── utils/                # 工具函数
    ├── validation.ts     # 验证工具
    └── format.ts         # 格式化工具
```

2. **状态管理模块** (@store)
```
src/modules/store/
├── api/             # 统一状态管理API
├── core/            # 核心状态管理实现
│   ├── BaseStore.ts
│   └── StoreManager.ts
└── adapters/        # 状态适配器
```

3. **AI模型管理模块** (@model)
```
src/modules/model/
├── api/             # 模型管理API
├── components/      # UI组件
├── context/         # 模型上下文
└── services/        # 模型服务
```

4. **辩论模块** (@debate)
```
src/modules/debate/
├── api/             # 辩论功能API
├── components/      # 辩论UI组件
├── services/        # 辩论核心服务
└── types/          # 辩论相关类型
```

5. **游戏配置模块** (@game-config)
```
src/modules/game-config/
├── api/             # 配置API
├── components/      # 配置UI组件
└── services/        # 配置服务
```

6. **角色管理模块** (@character)
```
src/modules/character/
├── api/             # 角色API
├── components/      # 角色UI组件
└── services/        # 角色服务
```

7. **共享模块** (@shared)
```
src/shared/
├── types/           # 共享类型
├── utils/           # 通用工具
└── constants/       # 共享常量
```

8. **核心模块** (@core)
```
src/core/
├── config/          # 核心配置
├── events/          # 事件总线
└── errors/          # 错误处理
```

## 3. 模块隔离实现

### 3.1 TypeScript 配置
```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@debate/*": ["modules/debate/*"],
      "@llm/*": ["modules/llm/*"],
      "@store/*": ["modules/store/*"],
      "@model/*": ["modules/model/*"],
      "@game-config/*": ["modules/game-config/*"],
      "@character/*": ["modules/character/*"],
      "@shared/*": ["shared/*"],
      "@core/*": ["core/*"]
    }
  }
}
```

### 3.2 ESLint 模块边界规则
```javascript
// .eslintrc.js
{
  "rules": {
    "import/no-restricted-paths": [
      "error",
      {
        "zones": [
          {
            "target": "./src/modules/debate",
            "from": "./src/modules/llm"
          },
          {
            "target": "./src/modules/llm",
            "from": "./src/modules/debate"
          }
          // ... 其他模块限制
        ]
      }
    ]
  }
}
```

## 4. 模块间通信

### 4.1 事件总线
```typescript
// @core/events/EventBus.ts
export class EventBus {
  private static instance: EventBus;
  private handlers: Map<string, Function[]> = new Map();

  static getInstance() {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  emit(event: string, data: any) {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  on(event: string, handler: Function) {
    const handlers = this.handlers.get(event) || [];
    this.handlers.set(event, [...handlers, handler]);
  }
}
```

### 4.2 模块注册机制
```typescript
// @core/ModuleRegistry.ts
export class ModuleRegistry {
  private static modules: Map<string, any> = new Map();

  static register(name: string, module: any) {
    this.modules.set(name, module);
  }

  static get(name: string) {
    return this.modules.get(name);
  }
}
```

## 5. 状态管理

### 5.1 模块状态隔离
```typescript
// @store/api/index.ts
export class ModuleStore<T> {
  private namespace: string;
  
  constructor(namespace: string) {
    this.namespace = namespace;
  }

  getState(): T {
    return StateManager.getInstance().getState(this.namespace);
  }
}
```

### 5.2 状态访问控制
```typescript
// 使用示例
const debateStore = new ModuleStore<DebateState>('debate');
const llmStore = new ModuleStore<LLMState>('llm');
```

## 6. 实施步骤

1. **准备阶段**
   - 创建新的目录结构
   - 配置 TypeScript 路径别名
   - 设置 ESLint 规则

2. **模块迁移**
   - LLM Service 模块（优先）
   - 状态管理模块
   - 其他功能模块

3. **重构过程**
   - 移动相关代码到对应模块
   - 更新导入路径
   - 实现模块间通信
   - 添加类型检查

4. **测试验证**
   - 单元测试
   - 集成测试
   - 功能测试

## 7. 注意事项

1. **模块独立性**
   - 每个模块应该是自包含的
   - 避免模块间的直接依赖
   - 通过预定义的接口通信

2. **类型安全**
   - 每个模块维护自己的类型定义
   - 共享类型放在 @shared/types
   - 避免类型定义重复

3. **状态管理**
   - 模块状态严格隔离
   - 使用事件总线进行状态同步
   - 避免全局状态污染

4. **代码组织**
   - 遵循统一的目录结构
   - 清晰的模块边界
   - 规范的命名约定

## 8. 预期收益

1. **代码质量**
   - 更清晰的代码结构
   - 更好的可维护性
   - 更容易理解和修改

2. **开发效率**
   - 减少冲突
   - 提高复用性
   - 便于团队协作

3. **可扩展性**
   - 易于添加新功能
   - 便于重构
   - 支持微前端架构

## 9. LLM Service 模块实施方案

### 9.1 模块结构
```
src/modules/llm/
├── api/                    # 对外暴露的API
│   ├── index.ts           # 统一导出
│   ├── types.ts           # API类型定义
│   └── events.ts          # 事件定义
├── services/              # 核心服务
│   ├── UnifiedLLMService.ts
│   └── provider/          # 不同供应商的实现
│       ├── base.ts        # 基础接口
│       ├── ollama.ts      # Ollama实现
│       ├── openai.ts      # OpenAI实现
│       └── deepseek.ts    # Deepseek实现
├── types/                 # 内部类型定义
│   ├── config.ts         # 配置类型
│   ├── response.ts       # 响应类型
│   └── error.ts          # 错误类型
├── adapters/              # 适配器
│   ├── index.ts          # 适配器导出
│   └── provider/         # 供应商适配器
└── utils/                # 工具函数
    ├── validation.ts     # 验证工具
    └── format.ts         # 格式化工具
```

### 9.2 模块边界定义

1. **对外API接口**
```typescript
// @llm/api/types.ts
export interface LLMServiceAPI {
  // 核心方法
  chat(message: ChatRequest): Promise<ChatResponse>;
  stream(message: ChatRequest): AsyncIterator<ChatResponse>;
  
  // 配置方法
  setModel(config: ModelConfig): void;
  getModel(): ModelConfig;
  
  // 状态方法
  getStatus(): ServiceStatus;
  
  // 测试方法
  test(config?: TestConfig): Promise<TestResult>;
}

// 事件定义
export enum LLMEvents {
  RESPONSE_RECEIVED = 'llm:response_received',
  ERROR_OCCURRED = 'llm:error_occurred',
  STATUS_CHANGED = 'llm:status_changed',
  MODEL_CHANGED = 'llm:model_changed'
}
```

2. **内部类型隔离**
```typescript
// @llm/types/config.ts
export interface ModelConfig {
  // 内部使用的配置类型
  readonly id: string;
  readonly provider: string;
  readonly model: string;
  readonly parameters: ModelParameters;
}

// @llm/types/response.ts
export interface ChatResponse {
  // 内部响应类型
  content: string;
  reasoning?: string;
  metadata: ResponseMetadata;
}
```

### 9.3 状态隔离

```typescript
// @llm/services/UnifiedLLMService.ts
export class UnifiedLLMService {
  private static instance: UnifiedLLMService;
  private currentModel: ModelConfig;
  private moduleStore: ModuleStore<LLMState>;
  
  private constructor() {
    this.moduleStore = new ModuleStore<LLMState>('llm');
    this.currentModel = this.moduleStore.getState().defaultModel;
  }
  
  static getInstance(): UnifiedLLMService {
    if (!UnifiedLLMService.instance) {
      UnifiedLLMService.instance = new UnifiedLLMService();
    }
    return UnifiedLLMService.instance;
  }
}
```

### 9.4 事件通信

```typescript
// @llm/api/events.ts
export const registerLLMEvents = () => {
  const eventBus = EventBus.getInstance();
  
  eventBus.on(LLMEvents.RESPONSE_RECEIVED, (response: ChatResponse) => {
    // 处理响应
  });
  
  eventBus.on(LLMEvents.ERROR_OCCURRED, (error: LLMError) => {
    // 处理错误
  });
};
```

### 9.5 实施步骤

1. **准备工作**
   - 创建模块目录结构
   - 配置 TypeScript 路径别名
   - 添加 ESLint 模块边界规则

2. **代码迁移**
   - 将现有 LLM 相关代码移动到新结构
   - 重构代码以符合新的模块边界
   - 实现新的模块接口

3. **依赖处理**
   - 识别并移除不必要的依赖
   - 通过 API 和事件替代直接依赖
   - 更新导入路径

4. **类型隔离**
   - 将类型定义移动到模块内
   - 创建类型转换适配器
   - 确保类型安全

5. **测试适配**
   - 更新单元测试
   - 添加集成测试
   - 验证模块边界

### 9.6 使用示例

```typescript
// 外部模块使用示例
import { LLMService } from '@llm/api';
import type { ChatRequest } from '@llm/api/types';

// 使用服务
const llmService = LLMService.getInstance();

// 发送请求
const response = await llmService.chat({
  message: '你好',
  context: '这是一个测试'
});

// 监听事件
EventBus.getInstance().on(LLMEvents.RESPONSE_RECEIVED, (response) => {
  console.log('收到响应:', response);
});
```

### 9.7 注意事项

1. **边界维护**
   - 严格遵守模块API定义
   - 不允许直接访问内部实现
   - 通过事件进行状态同步

2. **错误处理**
   - 统一错误类型定义
   - 提供清晰的错误信息
   - 实现错误重试机制

3. **性能考虑**
   - 最小化跨模块通信
   - 优化事件处理
   - 实现响应缓存

4. **测试策略**
   - 单元测试覆盖核心逻辑
   - 集成测试验证边界
   - 性能测试关注响应时间
```

## 8. LLM 服务模块改造实践

### 8.1 改造目标
- 实现 LLM 服务的完全模块化
- 统一不同供应商的接口
- 提供类型安全的 API
- 实现可测试和可维护的架构

### 8.2 核心改造内容

#### 8.2.1 服务层次结构
```typescript
// 1. 最外层服务接口
class LLMService {
  static getInstance(): LLMService;
  async chat(request: ChatRequest): Promise<ChatResponse>;
  async *stream(request: ChatRequest): AsyncGenerator<ChatResponse>;
  async testModel(config: ModelConfig): Promise<void>;
}

// 2. 统一服务实现
class UnifiedLLMService {
  private currentConfig: ModelConfig | null = null;
  private readonly providerManager: ProviderManager;
  private readonly store: IStateStore<LLMState>;
  private readonly eventBus = moduleEventBus;

  async setModel(modelId: string): Promise<void>;
  async chat(request: ChatRequest): Promise<ChatResponse>;
  async *stream(request: ChatRequest): AsyncGenerator<ChatResponse>;
}

// 3. 供应商管理
class ProviderManager {
  async getProvider(config: ModelConfig, skipModelValidation = false): Promise<LLMProvider>;
  async getModelConfig(modelId: string): Promise<ModelConfig | null>;
}
```

#### 8.2.2 适配器模式实现
```typescript
// 基础适配器接口
abstract class BaseProviderAdapter<TRequest, TResponse> {
  abstract adaptRequest(request: ChatRequest): TRequest;
  abstract adaptResponse(response: TResponse): ChatResponse;
  abstract adaptStream(stream: AsyncGenerator<TResponse>): AsyncGenerator<ChatResponse>;
}

// Ollama 适配器示例
class OllamaAdapter extends BaseProviderAdapter<OllamaRequest, OllamaResponse> {
  adaptRequest(request: ChatRequest): OllamaRequest {
    return {
      model: request.model || 'qwen2.5',
      messages: [
        ...(request.systemPrompt ? [{
          role: 'system',
          content: request.systemPrompt
        }] : []),
        {
          role: 'user',
          content: request.message
        }
      ],
      stream: request.stream,
      options: {
        temperature: request.temperature,
        top_p: request.topP,
        num_predict: request.maxTokens
      }
    };
  }
}
```

#### 8.2.3 React Hooks 封装
```typescript
// 模型测试 Hook
function useModelTest({
  modelConfig,
  onSuccess,
  onError,
  onStreamOutput
}: UseModelTestProps): UseModelTestResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const llmService = LLMService.getInstance();

  const testStream = useCallback(async (message: string, systemPrompt?: string) => {
    setLoading(true);
    try {
      await llmService.testModel(modelConfig);
      const stream = llmService.stream({
        message,
        systemPrompt,
        temperature: modelConfig.parameters.temperature,
        maxTokens: modelConfig.parameters.maxTokens,
        topP: modelConfig.parameters.topP,
        model: modelConfig.model,
        stream: true
      });

      for await (const response of stream) {
        onStreamOutput?.(response);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [modelConfig, onStreamOutput, handleError, llmService]);

  return { loading, error, testStream };
}
```

### 9.8 改造经验总结

1. **接口设计原则**
   - 使用抽象基类定义统一接口
   - 通过适配器模式处理差异
   - 保持接口简单且功能单一

2. **状态管理策略**
   - 使用单例模式管理全局状态
   - 实现响应式状态更新
   - 通过事件总线通知变更

3. **错误处理机制**
   - 统一的错误类型定义
   - 完整的错误上下文信息
   - 错误传播和转换机制

4. **类型安全保证**
   - 严格的类型定义
   - 运行时类型验证
   - 完整的类型推导

5. **测试友好设计**
   - 依赖注入便于测试
   - 接口模拟简单
   - 状态可预测性

### 9.9 后续优化建议

1. **性能优化**
   - 实现请求缓存
   - 添加请求队列
   - 优化流式传输

2. **可靠性提升**
   - 添加重试机制
   - 实现断线重连
   - 完善错误恢复

3. **监控与日志**
   - 添加性能监控
   - 实现日志系统
   - 错误追踪

4. **安全性增强**
   - 加强配置验证
   - API 密钥管理
   - 访问控制

### 9.10 注意事项

1. **配置管理**
   - 所有配置必须经过验证
   - 敏感信息需要加密
   - 配置变更需要记录

2. **状态一致性**
   - 保持状态更新的原子性
   - 避免状态泄露
   - 处理并发更新

3. **资源释放**
   - 及时清理无用连接
   - 释放不需要的资源
   - 防止内存泄漏

4. **版本兼容**
   - 保持向后兼容
   - 版本升级平滑
   - 接口废弃策略