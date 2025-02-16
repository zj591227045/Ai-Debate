# @llm 模块文档

## 1. 最近更新

### 1.1 错误处理增强
- 新增错误码：
  - `TIMEOUT`: 请求超时
  - `ABORTED`: 请求被中断
  - `INVALID_RESPONSE`: 无效响应
  - `BUFFER_OVERFLOW`: 缓冲区溢出
  - `API_ERROR`: API调用错误
  - `TEST_FAILED`: 测试失败

### 1.2 流处理优化
- 新增 `StreamHandler` 类，提供：
  - 超时控制
  - 缓冲区管理
  - 错误恢复
  - 中断处理
  - 元数据跟踪

### 1.3 重试机制
- 新增 `RetryHandler` 类，提供：
  - 指数退避策略
  - 可配置重试选项
  - 错误类型过滤
  - 重试状态跟踪
  - 支持普通异步操作和生成器

## 2. 使用指南

### 2.1 StreamHandler 使用

```typescript
import { StreamHandler } from './stream/StreamHandler';

// 创建处理器实例
const streamHandler = new StreamHandler({
  timeoutMs: 30000,        // 30秒超时
  maxBufferSize: 1048576,  // 1MB缓冲区限制
  signal: abortController.signal  // 可选的中断信号
});

// 处理流式响应
try {
  for await (const response of streamHandler.handleStream(provider.stream(request))) {
    // 处理响应chunk
    console.log(response.content);
  }
} finally {
  // 清理资源
  streamHandler.dispose();
}
```

### 2.2 RetryHandler 使用

```typescript
import { RetryHandler } from './retry/RetryHandler';

// 创建重试处理器
const retryHandler = new RetryHandler({
  maxAttempts: 3,          // 最大重试次数
  initialDelayMs: 1000,    // 初始延迟1秒
  maxDelayMs: 10000,       // 最大延迟10秒
  backoffFactor: 2,        // 指数退避因子
  retryableErrors: [       // 可重试的错误类型
    LLMErrorCode.NETWORK_ERROR,
    LLMErrorCode.TIMEOUT,
    LLMErrorCode.RATE_LIMIT_EXCEEDED
  ]
});

// 执行普通异步操作
try {
  const result = await retryHandler.execute(
    async () => await api.someOperation(),
    'API调用'  // 可选的上下文信息
  );
  console.log('操作成功:', result);
} catch (error) {
  console.error('重试后仍然失败:', error);
}

// 执行生成器操作
try {
  for await (const chunk of retryHandler.executeGenerator(
    () => api.streamOperation(),
    '流式调用'
  )) {
    console.log('收到数据:', chunk);
  }
} catch (error) {
  console.error('流式操作失败:', error);
}

// 获取重试状态
const metadata = retryHandler.getMetadata();
console.log('重试次数:', metadata.attempts);
console.log('总延迟时间:', metadata.totalDelayMs);
console.log('错误历史:', metadata.errors);
```

### 2.3 错误处理

```typescript
import { LLMError, LLMErrorCode } from '../types/error';

try {
  // 执行操作
} catch (error) {
  if (error instanceof LLMError) {
    switch (error.code) {
      case LLMErrorCode.TIMEOUT:
        console.error('请求超时:', error.message);
        break;
      case LLMErrorCode.BUFFER_OVERFLOW:
        console.error('缓冲区溢出:', error.message);
        break;
      case LLMErrorCode.API_ERROR:
        console.error('API错误:', error.message);
        break;
      default:
        console.error('其他LLM错误:', error.message);
    }
  } else {
    console.error('未知错误:', error);
  }
}
```

## 3. 最佳实践

### 3.1 流处理
1. 始终使用 `StreamHandler` 处理流式响应
2. 设置合适的超时时间和缓冲区大小
3. 提供中断信号以支持用户取消
4. 在 finally 块中调用 dispose() 清理资源

### 3.2 重试策略
1. 根据业务需求配置重试参数
2. 只对特定类型的错误进行重试
3. 使用上下文信息便于调试
4. 监控重试元数据以优化配置

### 3.3 错误处理
1. 使用具体的错误码而不是通用错误
2. 为每种错误提供清晰的错误消息
3. 在适当的层级处理错误
4. 记录详细的错误信息用于调试

## 4. 配置建议

### 4.1 StreamHandler 配置
```typescript
const defaultStreamOptions = {
  timeoutMs: 30000,        // 普通请求30秒
  maxBufferSize: 1048576,  // 1MB缓冲区
  retryAttempts: 3         // 3次重试机会
};

const longRunningStreamOptions = {
  timeoutMs: 300000,       // 长时间运行5分钟
  maxBufferSize: 5242880,  // 5MB缓冲区
  retryAttempts: 5         // 5次重试机会
};
```

### 4.2 RetryHandler 配置
```typescript
const defaultRetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2
};

const aggressiveRetryOptions = {
  maxAttempts: 5,
  initialDelayMs: 500,
  maxDelayMs: 30000,
  backoffFactor: 1.5
};
```

## 5. 调试指南

### 5.1 日志级别
```typescript
// 开发环境
const debugOptions = {
  logLevel: 'debug',
  logRetries: true,
  logStreamChunks: true
};

// 生产环境
const productionOptions = {
  logLevel: 'error',
  logRetries: false,
  logStreamChunks: false
};
```

### 5.2 故障排除
1. 检查重试元数据了解失败原因
2. 查看流处理器的缓冲区使用情况
3. 分析错误模式以优化重试策略
4. 监控响应时间和成功率

## 6. 注意事项

1. 避免过度重试，可能导致:
   - 资源浪费
   - 服务端压力
   - 用户体验下降

2. 合理设置超时时间:
   - 考虑网络延迟
   - 考虑服务端处理时间
   - 考虑用户等待意愿

3. 缓冲区管理:
   - 避免内存泄漏
   - 及时清理资源
   - 监控使用情况

4. 错误处理:
   - 提供有意义的错误信息
   - 正确区分错误类型
   - 适当的错误恢复 