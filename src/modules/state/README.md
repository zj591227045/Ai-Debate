# 状态管理模块

## 简介

这是一个统一的状态管理模块，用于管理应用中的各种状态。它提供了以下功能：

- 统一的状态管理接口
- 类型安全的状态访问
- 状态持久化
- 状态订阅
- React Hooks 支持

## 使用方法

### 初始化

在应用启动时初始化状态管理：

```typescript
import { initializeState } from '@state';

initializeState();
```

### 在 React 组件中使用

使用提供的 Hooks 访问状态：

```typescript
import { useStore, useStoreSelector } from '@state';

// 使用整个存储
function GameConfigComponent() {
  const { state, setState } = useStore('gameConfig');
  
  return (
    <div>
      <h1>{state.topic.title}</h1>
      <button onClick={() => setState({ topic: { ...state.topic, title: 'New Title' } })}>
        更新标题
      </button>
    </div>
  );
}

// 使用选择器
function ModelConfigComponent() {
  const temperature = useStoreSelector('model', state => state.config.temperature);
  const dispatch = useStoreDispatch('model');
  
  return (
    <div>
      <span>Temperature: {temperature}</span>
      <button onClick={() => dispatch({ config: { temperature: 0.8 } })}>
        调整温度
      </button>
    </div>
  );
}
```

### 持久化

状态会自动持久化，也可以手动控制：

```typescript
import { useStorePersistence } from '@state';

function PersistenceComponent() {
  const { persist, hydrate } = useStorePersistence('gameConfig');
  
  return (
    <div>
      <button onClick={persist}>保存状态</button>
      <button onClick={hydrate}>恢复状态</button>
    </div>
  );
}
```

### 重置状态

```typescript
import { useStoreReset } from '@state';

function ResetComponent() {
  const reset = useStoreReset('gameConfig');
  
  return (
    <button onClick={reset}>重置状态</button>
  );
}
```

### 统一状态管理

```typescript
import { useUnifiedState } from '@state';

function UnifiedStateComponent() {
  const { state, setState } = useUnifiedState();
  
  return (
    <div>
      <pre>{JSON.stringify(state, null, 2)}</pre>
      <button onClick={() => setState({ 
        gameConfig: { /* ... */ },
        model: { /* ... */ }
      })}>
        更新状态
      </button>
    </div>
  );
}
```

## 目录结构

```
src/modules/state/
├── api/                # API 接口
│   ├── hooks.ts       # React Hooks
│   └── index.ts       # API 导出
├── core/              # 核心实现
│   ├── BaseStore.ts   # 基础存储类
│   ├── EventBus.ts    # 事件总线
│   └── StoreManager.ts # 存储管理器
├── stores/            # 具体存储实现
│   ├── GameConfigStore.ts
│   ├── ModelStore.ts
│   └── GameRulesStore.ts
├── types/             # 类型定义
│   ├── store.ts       # 存储相关类型
│   ├── state.ts       # 状态相关类型
│   └── error.ts       # 错误类型
└── index.ts           # 模块导出
```

## 注意事项

1. 确保在使用任何状态之前调用 `initializeState()`
2. 状态更新是同步的，但持久化是异步的
3. 所有状态更新都会触发相关组件的重新渲染
4. 使用选择器可以优化性能，避免不必要的重渲染
5. 状态验证确保数据的完整性和类型安全 