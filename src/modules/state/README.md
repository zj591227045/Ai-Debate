# 状态管理模块

## 模块概述

这是一个统一的状态管理模块，提供了类型安全的状态管理解决方案。主要特性包括：

- 基于 TypeScript 的类型安全状态管理
- 统一的状态容器和管理接口
- 支持状态持久化和恢复
- 内置事件系统
- React Hooks 支持
- 调试工具支持

## 核心概念

### 状态容器

每个状态都包含在一个 `StateContainer` 中：

```typescript
interface StateContainer<T> {
  data: T;
  metadata: {
    version: string;
    lastUpdated: number;
    namespace: string;
  };
}
```

### 存储管理器

使用 `StoreManager` 统一管理所有状态：

```typescript
const storeManager = StoreManager.getInstance();
const llmStore = storeManager.getStore<LLMState>('llm');
```

### 事件系统

使用 `EventBus` 处理状态变更事件：

```typescript
enum StoreEvents {
  STATE_CHANGED = 'state:state_changed',
  PERSIST_COMPLETED = 'state:persist_completed',
  HYDRATE_COMPLETED = 'state:hydrate_completed',
  ERROR_OCCURRED = 'state:error_occurred'
}
```

## 使用方法

### 1. 在组件中使用状态

```typescript
import { useStore } from '../modules/state';

function GameConfigComponent() {
  const { state: gameConfig, setState: setGameConfig } = useStore('gameConfig');
  
  // 更新状态
  const handleTopicChange = (title: string) => {
    setGameConfig({
      topic: {
        ...gameConfig.topic,
        title
      }
    });
  };
  
  return (
    <div>
      <input
        value={gameConfig.topic.title}
        onChange={e => handleTopicChange(e.target.value)}
      />
    </div>
  );
}
```

### 2. 状态持久化

```typescript
// 自动持久化
const store = new BaseStore({
  namespace: 'gameConfig',
  version: '1.0.0',
  persistence: {
    enabled: true,
    storage: 'local'
  }
});

// 手动持久化
await store.persist();
await store.hydrate();
```

### 3. 事件监听

```typescript
import { StoreEvents } from '../types/store';

// 监听状态变更
eventBus.on(StoreEvents.STATE_CHANGED, (state) => {
  console.log('状态已更新:', state);
});

// 监听错误
eventBus.on(StoreEvents.ERROR_OCCURRED, (error) => {
  console.error('发生错误:', error);
});
```

### 4. 调试支持

```typescript
import { StateLogger } from '../modules/state/utils';

const logger = StateLogger.getInstance();

logger.debug('gameConfig', '状态发生变化', {
  newState: gameConfig,
  timestamp: new Date().toISOString(),
  source: 'GameConfig.stateChange'
});
```

## API 参考

### StoreManager

```typescript
class StoreManager {
  static getInstance(): StoreManager;
  getStore<T>(namespace: string): BaseStore<T>;
  registerStore<T>(store: BaseStore<T>): void;
  getUnifiedState(): UnifiedState;
  updateUnifiedState(update: Partial<UnifiedState>): void;
}
```

### BaseStore

```typescript
abstract class BaseStore<T> {
  protected readonly namespace: string;
  protected state: StateContainer<T>;
  
  setState(update: Partial<T>): void;
  getState(): T;
  resetState(): void;
  persist(): Promise<void>;
  hydrate(): Promise<void>;
}
```

### React Hooks

```typescript
// 使用完整存储
const { state, setState } = useStore(namespace);

// 使用状态选择器
const value = useStoreSelector(namespace, selector);

// 重置状态
const reset = useStoreReset(namespace);
```

## 目录结构

```
src/modules/state/
├── api/                    # API接口
│   ├── hooks.ts           # React Hooks
│   ├── types.ts           # API类型定义
│   └── events.ts          # 事件定义
├── core/                  # 核心实现
│   ├── BaseStore.ts      # 存储基类
│   ├── StoreManager.ts   # 存储管理器
│   └── StateContainer.ts # 状态容器
├── stores/               # 具体存储实现
│   ├── LLMStore.ts      # LLM状态存储
│   ├── GameConfigStore.ts # 游戏配置存储
│   └── SessionStore.ts   # 会话状态存储
├── types/                # 类型定义
│   ├── store.ts         # 存储类型
│   ├── state.ts         # 状态类型
│   ├── session.ts       # 会话类型
│   ├── llm.ts          # LLM类型
│   └── error.ts         # 错误类型
├── utils/               # 工具函数
│   ├── StateLogger.ts  # 状态日志
│   └── validation.ts   # 验证工具
└── adapters/           # 存储适配器
    ├── memory.ts       # 内存存储
    └── local.ts        # 本地存储
```

## 最佳实践

1. **状态设计**
   - 保持状态扁平化
   - 避免冗余数据
   - 使用不可变更新模式

2. **性能优化**
   - 使用选择器减少重渲染
   - 批量更新状态
   - 合理使用持久化

3. **错误处理**
   - 始终处理异步操作的错误
   - 使用类型化的错误
   - 记录错误上下文

4. **调试**
   - 使用 StateLogger 记录关键操作
   - 在开发环境启用详细日志
   - 使用状态快照进行调试

## 注意事项

1. 确保在应用启动时初始化 StoreManager
2. 使用 TypeScript 的严格模式
3. 避免直接修改状态对象
4. 合理使用状态持久化
5. 处理所有异步操作的错误 