# @model 模块文档

## 1. 供应商扩展指南

### 1.1 目录结构
```
src/modules/model/
├── components/
│   └── providers/
│       ├── BaseProviderForm.tsx      # 基础供应商表单组件
│       ├── ProviderFormFactory.tsx   # 供应商表单工厂
│       ├── OllamaProviderForm.tsx    # Ollama 供应商实现
│       ├── SiliconFlowProviderForm.tsx # SiliconFlow 供应商实现
│       └── styles.css                # 共享样式
├── services/
│   ├── ModelService.ts              # 模型服务
│   └── {Provider}Service.ts         # 供应商特定服务
└── types/
    └── config.ts                    # 配置类型定义
```

### 1.2 添加新供应商步骤

1. **更新供应商类型**
   - 在 `src/modules/llm/types/providers.ts` 中添加新的供应商类型
   - 定义供应商特定的配置接口

2. **添加供应商配置**
   - 在 `src/modules/model/config/providers.ts` 中添加新供应商的配置
   - 包括名称、描述、认证要求、默认参数等

3. **创建供应商服务**
   - 在 `services` 目录下创建新的服务类，如 `NewProviderService.ts`
   - 实现模型列表获取、认证等供应商特定的功能

4. **实现供应商表单**
   - 在 `components/providers` 目录下创建新的表单组件
   - 遵循以下实现规范：

### 1.3 供应商表单实现规范

1. **组件结构**
```typescript
// NewProviderForm.tsx
import React, { useState, useEffect } from 'react';
import { IProviderForm, ProviderFormProps } from './ProviderFormFactory';

// 函数组件实现具体的表单逻辑
const NewProviderFormComponent: React.FC<ProviderFormProps> = ({
  formData,
  providerConfig,
  isLoading,
  onChange,
  onTest
}) => {
  // 状态管理
  const [availableModels, setAvailableModels] = useState(...);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [error, setError] = useState(null);

  // 副作用处理
  useEffect(() => {
    // 处理认证信息变化等
  }, [依赖项]);

  // 事件处理
  const handleAuthChange = (...) => {...};
  const handleModelChange = (...) => {...};

  return (
    // 渲染表单
  );
};

// 类组件作为包装器实现接口
export class NewProviderForm implements IProviderForm {
  private props: ProviderFormProps;

  constructor(props: ProviderFormProps) {
    this.props = props;
  }

  render(): React.ReactNode {
    return <NewProviderFormComponent {...this.props} />;
  }
}
```

2. **状态管理注意事项**
   - 使用 React Hooks 管理状态，不要在类组件中使用状态
   - 将所有状态和副作用逻辑放在函数组件中
   - 类组件仅作为实现接口的包装器

3. **副作用处理**
   - 使用 `useEffect` 监听认证信息变化
   - 在认证信息变化时自动更新模型列表
   - 清理副作用以防止内存泄漏

4. **错误处理**
   - 统一使用 `error` 状态管理错误信息
   - 在 catch 块中设置错误状态
   - 显示友好的错误提示

5. **加载状态**
   - 使用 `isLoading` 状态控制表单禁用
   - 显示加载指示器
   - 防止重复提交

### 1.4 最佳实践

1. **状态隔离**
   - 每个供应商表单维护自己的状态
   - 不要共享可变状态
   - 通过 props 传递数据和回调

2. **类型安全**
   - 使用 TypeScript 接口定义 props 和状态
   - 确保类型覆盖所有可能的值
   - 避免使用 any 类型

3. **性能优化**
   - 使用 `useCallback` 和 `useMemo` 优化回调和计算
   - 避免不必要的重渲染
   - 合理设置 `useEffect` 依赖项

4. **代码组织**
   - 将复杂逻辑抽取为独立函数
   - 使用自定义 hooks 复用逻辑
   - 保持组件职责单一

5. **测试考虑**
   - 编写单元测试验证表单逻辑
   - 测试错误处理和边界情况
   - 模拟网络请求和异步操作

### 1.5 常见问题

1. **状态更新不生效**
   - 确保在函数组件中使用 hooks
   - 检查 useEffect 依赖项
   - 验证状态更新逻辑

2. **类型错误**
   - 检查接口定义
   - 确保实现了所有必要的方法
   - 验证泛型参数

3. **性能问题**
   - 检查不必要的重渲染
   - 优化数据结构
   - 使用性能分析工具

4. **内存泄漏**
   - 清理异步操作
   - 取消未完成的请求
   - 在组件卸载时清理资源

### 1.6 调试指南

1. **开发工具**
   - 使用 React Developer Tools 检查组件状态
   - 使用 Network 面板监控 API 请求
   - 使用 Console 查看错误和日志

2. **日志记录**
   - 记录关键操作和状态变化
   - 使用不同级别的日志
   - 在生产环境禁用调试日志

3. **错误追踪**
   - 使用错误边界捕获渲染错误
   - 记录详细的错误信息
   - 实现错误报告机制

## 2. 其他文档
// ... 其他现有文档内容 