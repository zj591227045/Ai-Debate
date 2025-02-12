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



## 10. 状态管理模块实施方案

### 10.1 模块结构
```
src/modules/state/
├── api/                    # 对外暴露的API
│   ├── index.ts           # 统一导出
│   ├── types.ts           # API类型定义
│   └── events.ts          # 事件定义
├── core/                  # 核心实现
│   ├── BaseStore.ts      # 存储基类
│   ├── StoreManager.ts   # 存储管理器
│   └── StateContainer.ts # 状态容器
├── types/                 # 内部类型定义
│   ├── store.ts          # 存储类型
│   ├── state.ts          # 状态类型
│   └── error.ts          # 错误类型
├── adapters/              # 存储适配器
│   ├── index.ts          # 适配器导出
│   ├── memory.ts         # 内存存储
│   └── local.ts          # 本地存储
└── utils/                # 工具函数
    ├── validation.ts     # 验证工具
    └── persistence.ts    # 持久化工具
```

### 10.2 模块边界定义

1. **对外API接口**
```typescript
// @state/api/types.ts
export interface IStateStore<T> {
  // 状态操作
  getState(): T;
  setState(state: Partial<T>): void;
  resetState(): void;
  
  // 订阅管理
  subscribe(listener: (state: T) => void): () => void;
  
  // 持久化
  persist(): Promise<void>;
  hydrate(): Promise<void>;
}

// 事件定义
export enum StoreEvents {
  STATE_CHANGED = 'state:state_changed',
  PERSIST_COMPLETED = 'state:persist_completed',
  HYDRATE_COMPLETED = 'state:hydrate_completed',
  ERROR_OCCURRED = 'state:error_occurred'
}
```

2. **内部类型隔离**
```typescript
// @state/types/store.ts
export interface StoreConfig {
  namespace: string;
  version: string;
  persistence?: {
    enabled: boolean;
    key?: string;
    storage?: 'local' | 'session' | 'memory';
  };
  validation?: {
    schema: unknown;
    options?: ValidationOptions;
  };
}

// @state/types/state.ts
export interface StateContainer<T> {
  data: T;
  metadata: {
    version: string;
    lastUpdated: number;
    namespace: string;
  };
}
```

### 10.3 状态隔离

```typescript
// @state/core/BaseStore.ts
export abstract class BaseStore<T> {
  protected readonly namespace: string;
  protected state: StateContainer<T>;
  private subscribers = new Set<(state: T) => void>();
  
  constructor(config: StoreConfig) {
    this.namespace = config.namespace;
    this.state = this.createInitialState();
  }
  
  protected abstract createInitialState(): StateContainer<T>;
  protected abstract validateState(state: T): boolean;
  
  setState(update: Partial<T>): void {
    const newState = { ...this.state.data, ...update };
    if (this.validateState(newState)) {
      this.state.data = newState;
      this.notifySubscribers();
    }
  }
}
```

### 10.4 事件通信

```typescript
// @state/api/events.ts
export const registerStoreEvents = () => {
  const eventBus = EventBus.getInstance();
  
  eventBus.on(StoreEvents.STATE_CHANGED, (payload: StateChangePayload) => {
    // 处理状态变更
    console.log(`State changed in ${payload.namespace}`);
  });
  
  eventBus.on(StoreEvents.ERROR_OCCURRED, (error: StoreError) => {
    // 处理错误
    console.error(`Store error: ${error.message}`);
  });
};
```

### 10.5 实施步骤

1. **前期准备工作**
   - 分析现有状态管理结构
     - 分析 `src/store` 目录结构
     - 分析 `src/modules/store` 目录结构
     - 整理需迁移的状态类型和接口
   - 创建新的模块目录结构 `src/modules/state`
   - 配置 TypeScript 路径别名 `@state/*`
   - 设置 ESLint 模块边界规则
   - 创建模块级 README.md 文档

2. **核心改造任务**
   - 创建核心目录结构：
     ```
     src/modules/state/
     ├── api/
     ├── core/
     ├── types/
     ├── adapters/
     └── utils/
     ```
   - 实现基础存储类：
     - 实现 `core/BaseStore.ts`
     - 实现 `core/StoreManager.ts`
     - 实现 `core/StateContainer.ts`
   - 实现状态管理器：
     - 实现统一状态容器
     - 实现状态验证机制
     - 实现事件发布订阅系统

3. **类型定义迁移**
   - 创建基础类型文件：
     - 实现 `types/store.ts` - 存储相关类型
     - 实现 `types/state.ts` - 状态相关类型
     - 实现 `types/error.ts` - 错误类型定义
   - 从现有代码迁移类型定义：
     - 从 `src/store/slices` 迁移 Redux 状态类型
     - 从 `src/modules/store` 迁移现有状态类型
   - 统一类型命名规范
   - 添加类型文档注释

4. **状态迁移任务**
   - 游戏配置状态迁移：
     - 从 `gameConfigSlice.ts` 迁移状态和逻辑
     - 实现新的游戏配置存储类
     - 迁移配置历史管理功能
   - 模型状态迁移：
     - 从 `ModelStore.ts` 迁移状态和逻辑
     - 实现新的模型状态存储类
     - 迁移模型配置管理功能
   - 游戏规则状态迁移：
     - 从 `GameRulesStore.ts` 迁移状态和逻辑
     - 实现新的规则状态存储类
     - 迁移规则配置管理功能

5. **API 层实现**
   - 实现统一的 API 接口：
     - 实现状态获取/设置接口
     - 实现状态订阅接口
     - 实现持久化接口
   - 实现 React Hooks：
     - 实现 `useStore` Hook
     - 实现 `useStoreSelector` Hook
     - 实现 `useStoreDispatch` Hook
   - 实现事件总线集成

6. **组件适配任务**
   - 扫描现有组件：
     - 扫描使用 Redux 的组件
     - 扫描使用旧状态管理的组件
   - 更新组件中的状态访问方式：
     - 替换 `useSelector` 和 `useDispatch` 使用
     - 替换直接的 Store 实例访问
   - 更新状态订阅逻辑：
     - 更新事件监听机制
     - 优化组件重渲染逻辑

7. **测试套件更新**
   - 单元测试：
     - 实现状态管理模块测试
     - 实现存储适配器测试
     - 实现 API 接口测试
   - 集成测试：
     - 实现状态迁移测试
     - 实现持久化机制测试
     - 实现组件集成测试
   - 性能测试：
     - 实现状态更新性能测试
     - 实现组件重渲染性能测试
     - 实现持久化性能测试

8. **清理任务**
   - 代码清理：
     - 移除 Redux 相关依赖
     - 删除旧的状态管理代码
     - 清理无用的类型定义
   - 配置清理：
     - 更新 TypeScript 配置
     - 更新 ESLint 规则
     - 更新构建配置

9. **文档和工具支持**
   - API 文档：
     - 编写新状态管理 API 文档
     - 编写状态迁移指南
     - 编写最佳实践指南
   - 示例代码：
     - 编写基础使用示例
     - 编写高级特性示例
     - 编写迁移示例
   - 开发工具：
     - 实现状态调试工具
     - 添加日志记录功能
     - 开发性能监控工具

10. **发布计划**
    - 准备工作：
      - 创建发布分支
      - 准备回滚方案
      - 准备发布说明
    - 发布步骤：
      - 执行代码审查
      - 运行完整测试套件
      - 执行性能测试
      - 准备发布包

预计时间安排：
- 前期准备工作: 1天
- 核心改造任务: 3天
- 类型定义迁移: 1天
- 状态迁移任务: 2天
- API 层实现: 2天
- 组件适配任务: 3天
- 测试套件更新: 2天
- 清理任务: 1天
- 文档和工具支持: 1天
- 发布计划: 1天

总计工作量：约17个工作日

优先级排序：
1. 前期准备工作
2. 核心改造任务
3. 类型定义迁移
4. 状态迁移任务
5. API 层实现
6. 组件适配任务
7. 测试套件更新
8. 清理任务
9. 文档和工具支持
10. 发布计划

风险评估：
- 高风险：状态迁移过程中的数据丢失
- 中风险：组件适配过程中的功能regression
- 低风险：性能退化

应对策略：
1. 实施前完整备份所有状态数据
2. 为每个组件编写集成测试
3. 建立性能基准并持续监控
4. 准备详细的回滚方案
5. 分阶段进行改造，确保每个阶段都是可用状态


### 10.16 新旧代码并行策略

1. **目录结构设计**
  ```
src/modules/store/           # 保持现有目录不变
    ├── ModelStore.ts       # 现有代码
    ├── GameRulesStore.ts   # 现有代码
    └── StoreManager.ts     # 现有代码

src/modules/state/          # 全新的状态管理模块
    ├── api/               # 新的API实现
    ├── core/             # 新的核心实现
    ├── types/            # 新的类型定义
    └── adapters/         # 新的适配器
```

2. **并行开发策略**
   - 保持现有 `@store/*` 代码和路径完全不变
   - 新代码使用 `@state/*` 作为模块路径
   - 需要复用的代码直接复制到新模块并重构
   - 新功能直接使用新模块实现

3. **路径配置**
```typescript
// tsconfig.paths.json
{
  "compilerOptions": {
    "paths": {
      "@store/*": ["modules/store/*"],     // 保持现有路径
      "@state/*": ["modules/state/*"]      // 新增状态管理路径
    }
  }
}
```

4. **代码复用处理**
   - 识别需要复用的核心代码
   - 复制到新模块并进行重构
   - 添加新的类型定义和接口
   - 确保新旧版本完全隔离

5. **渐进式迁移**
   - 新功能直接使用 `@state/*`
   - 现有功能保持使用 `@store/*`
   - 按模块逐步迁移到新实现
   - 不强制一次性完成迁移

6. **状态共存方案**
```typescript
// 旧代码继续使用现有方式
import { ModelStore } from '@store/ModelStore';

// 新代码使用新模块
import { createStore } from '@state/api';
```

7. **测试策略**
   - 新代码编写独立测试
   - 现有测试保持不变
   - 确保两套代码互不影响
   - 按需添加集成测试

8. **文档要求**
   - 新模块添加完整文档
   - 明确标记推荐使用新模块
   - 提供迁移指南
   - 记录API差异

时间安排：
- 新模块搭建：2天
- 核心功能实现：5天
- 新功能开发：按需进行
- 可选迁移：根据实际需求

优势：
1. 不影响现有代码
2. 降低迁移风险
3. 可以渐进式迁移
4. 便于新功能开发

注意事项：
1. 明确区分新旧模块职责
2. 避免代码重复维护
3. 控制模块依赖关系
4. 保持向后兼容性


### 10.17 配置历史管理


// 配置历史记录接口
interface ConfigHistory {
  activeConfig: GameConfigState;    // 当前激活的配置
  savedConfigs: GameConfigState[];  // 历史配置记录
  lastModified: number;            // 最后修改时间
}

// 配置管理API
export const configStateAPI = {
  // 保存当前配置
  saveCurrentConfig(): void;
  // 加载历史配置
  loadConfig(id: string): void;
  // 重置配置
  resetConfig(): void;
  // 获取配置历史
  getConfigHistory(): ConfigHistory;
}
```

### 10.18 会话状态管理

```typescript
// 会话状态接口
interface SessionState {
  configState: ConfigHistory;      // 配置历史
  debateState: {
    status: DebateStatus;         // 辩论状态
    progress: DebateProgress;     // 进度信息
    history: DebateHistory;       // 历史记录
  };
  timestamp: number;              // 会话时间戳
}

// 会话管理器
export class SessionManager {
  // 保存会话状态
  static saveSession(state: SessionState): void {
    sessionStorage.setItem('debate_session', JSON.stringify({
      ...state,
      timestamp: Date.now()
    }));
  }

  // 恢复会话状态
  static restoreSession(): SessionState | null {
    const saved = sessionStorage.getItem('debate_session');
    if (!saved) return null;
    
    const state = JSON.parse(saved);
    // 检查会话是否过期（比如24小时）
    if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem('debate_session');
      return null;
    }
    return state;
  }

  // 清除会话
  static clearSession(): void {
    sessionStorage.removeItem('debate_session');
  }
}
```

### 10.19 配置重置功能

```typescript
// 初始状态定义
const INITIAL_STATE: GameConfigState = {
  topic: {
    title: '',
    description: '',
    background: ''
  },
  rules: {
    totalRounds: 4,
    debateFormat: 'standard',
    timeLimit: 180
  },
  players: [],
  ruleConfig: DEFAULT_RULE_CONFIG
};

// 重置选项接口
export interface ResetOptions {
  topic?: boolean;
  rules?: boolean;
  players?: boolean;
  all?: boolean;
}

// 重置API
export const resetConfigWithOptions = (options: ResetOptions) => {
  const currentState = getStateManager().getUnifiedState().gameConfig;
  const newState = { ...currentState };
  
  if (options.all) {
    return resetConfig();
  }
  
  if (options.topic) {
    newState.topic = INITIAL_STATE.topic;
  }
  if (options.rules) {
    newState.rules = INITIAL_STATE.rules;
  }
  if (options.players) {
    newState.players = INITIAL_STATE.players;
  }
  
  getStateManager().updateUnifiedState({
    gameConfig: newState,
    character: getStateManager().getUnifiedState().character
  });
};
```

### 10.20 状态持久化策略

1. **存储层级**
   - 配置历史：使用 `localStorage` 长期保存
   - 会话状态：使用 `sessionStorage` 临时保存
   - 运行时状态：内存中维护

2. **自动保存机制**
```typescript
// App.tsx 中实现
useEffect(() => {
  // 1. 尝试恢复会话状态
  const session = SessionManager.restoreSession();
  if (session) {
    getStateManager().updateUnifiedState(session);
  }
  
  // 2. 定期保存状态
  const saveInterval = setInterval(() => {
    const currentState = getStateManager().getUnifiedState();
    SessionManager.saveSession(currentState);
  }, 30000); // 每30秒
  
  // 3. 页面关闭前保存
  const handleBeforeUnload = () => {
    const currentState = getStateManager().getUnifiedState();
    SessionManager.saveSession(currentState);
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    clearInterval(saveInterval);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, []);
```

### 10.21 用户体验优化

1. **配置操作反馈**
   - 配置重置时显示确认对话框
   - 提供配置历史浏览界面
   - 显示最后保存时间
   - 添加自动保存提示

2. **状态恢复流程**
   - 页面加载时自动恢复上次会话
   - 提供手动恢复历史配置功能
   - 支持配置导入/导出

3. **错误处理**
   - 状态恢复失败时的回退机制
   - 保存失败时的重试机制
   - 清晰的错误提示

### 10.22 实施步骤

1. **准备工作**
   - 完善状态类型定义
   - 实现基础的存储工具
   - 设计状态迁移策略

2. **核心功能实现**
   - 配置历史管理
   - 会话状态管理
   - 配置重置功能

3. **持久化机制**
   - 实现存储适配器
   - 添加自动保存逻辑
   - 实现状态恢复机制

4. **UI组件适配**
   - 更新配置表单组件
   - 添加历史记录查看界面
   - 实现重置确认对话框

5. **测试与优化**
   - 单元测试覆盖
   - 性能测试
   - 用户体验优化

### 10.23 注意事项

1. **状态一致性**
   - 确保状态更新的原子性
   - 处理并发更新冲突
   - 维护状态版本信息

2. **性能考虑**
   - 避免频繁的存储操作
   - 优化序列化/反序列化过程
   - 合理设置自动保存间隔

3. **安全性**
   - 敏感信息的处理
   - 存储数据的加密
   - 防止XSS攻击

4. **兼容性**
   - 处理存储配额限制
   - 兼容不同浏览器的存储机制
   - 优雅降级方案

## 10.15 状态管理模块开发进度

### 10.15.1 已完成工作

1. **核心类型定义**
   - 完成 `store.ts` - 存储相关类型定义
   - 完成 `state.ts` - 状态数据类型定义
   - 完成 `error.ts` - 错误处理类型定义
   - 完成 `session.ts` - 会话状态类型定义

2. **核心功能实现**
   - 完成 `BaseStore` - 基础存储类
   - 完成 `EventBus` - 事件总线
   - 完成 `StoreManager` - 存储管理器
   - 完成 `StateContainer` - 状态容器工厂

3. **存储实现**
   - 完成 `GameConfigStore` - 游戏配置存储
   - 完成 `ModelStore` - 模型存储
   - 完成 `GameRulesStore` - 游戏规则存储

4. **API 层**
   - 完成 React Hooks 实现
   - 完成统一的 API 接口
   - 完成状态初始化功能

5. **问题修复**
   - 解决了类型循环依赖问题
   - 修复了 StoreError 命名冲突
   - 优化了模块导出结构

### 10.15.2 后续工作规划

1. **存储适配器开发** (预计 2 天)
   - [ ] 实现内存存储适配器
   - [ ] 实现本地存储适配器
   - [ ] 实现会话存储适配器
   - [ ] 添加适配器测试用例

2. **状态验证增强** (预计 2 天)
   - [ ] 实现 JSON Schema 验证
   - [ ] 添加自定义验证器支持
   - [ ] 实现验证错误收集
   - [ ] 添加验证性能优化

3. **状态迁移工具** (预计 3 天)
   - [ ] 实现状态版本管理
   - [ ] 实现向前/向后迁移
   - [ ] 添加迁移日志记录
   - [ ] 实现迁移回滚机制

4. **性能优化** (预计 2 天)
   - [ ] 实现状态更新批处理
   - [ ] 添加状态缓存机制
   - [ ] 优化事件触发机制
   - [ ] 实现选择性更新

5. **开发工具支持** (预计 2 天)
   - [ ] 实现状态调试工具
   - [ ] 添加性能监控
   - [ ] 实现状态快照
   - [ ] 添加日志记录

6. **文档完善** (预计 1 天)
   - [ ] 更新 API 文档
   - [ ] 添加最佳实践指南
   - [ ] 编写迁移指南
   - [ ] 补充示例代码

### 10.15.3 执行计划

#### 第一周
- 周一：开始存储适配器开发
- 周二：完成存储适配器和测试
- 周三：开始状态验证增强
- 周四：完成验证功能和测试
- 周五：开始状态迁移工具开发

#### 第二周
- 周一：继续状态迁移工具开发
- 周二：完成迁移工具和测试
- 周三：进行性能优化
- 周四：开发调试工具支持
- 周五：完善文档和示例

### 10.15.4 风险评估

1. **技术风险**
   - 状态迁移复杂度高
   - 性能优化可能影响稳定性
   - 适配器兼容性问题

2. **进度风险**
   - 验证功能可能需要更多时间
   - 调试工具开发可能延期
   - 文档工作量可能超出预期

3. **应对策略**
   - 设置每日检查点
   - 准备备选方案
   - 保持灵活的任务优先级
   - 及时调整资源分配
