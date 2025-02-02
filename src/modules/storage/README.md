# 存储管理模块

本模块提供了一个完整的存储管理解决方案,包括本地存储、IndexedDB 存储以及数据备份功能。

## 功能特性

- 本地存储 (LocalStorage) 管理
- IndexedDB 存储管理
- 数据备份和恢复
- 版本控制和兼容性检查
- 用户友好的备份管理界面

## 使用方法

### 基础存储操作

```typescript
import { storage } from '@/modules/storage';

// LocalStorage 操作
await storage.local.set('key', value);
const data = await storage.local.get('key');

// IndexedDB 操作
await storage.db.set('store', value);
const dbData = await storage.db.get('store');
```

### 数据备份

```typescript
import { storage } from '@/modules/storage';

// 创建并下载备份
await storage.backup.downloadBackup();

// 验证备份文件
const backupFile = event.target.files[0];
const validation = await storage.backup.validateBackup(backupFile);
if (validation.isValid) {
  console.log('备份文件有效');
  console.log('备份信息:', validation.meta);
}

// 从备份恢复
await storage.backup.restoreFromBackup(backupFile);
```

### 使用备份管理界面

```vue
<template>
  <BackupManager />
</template>

<script setup>
import { BackupManager } from '@/modules/storage/components';
</script>
```

## 配置

存储配置位于 `config/storage.config.ts`:

```typescript
export const storageConfig = {
  version: {
    current: '1.0.0',    // 当前版本
    minimum: '1.0.0',    // 最低兼容版本
  },
  storageKeys: {
    playerProfiles: 'player_profiles',
    debateHistory: 'debate_history',
    userPreferences: 'user_preferences',
  },
};
```

## 错误处理

所有存储相关的错误都会抛出 `StorageError` 类型的异常:

```typescript
try {
  await storage.backup.restoreFromBackup(file);
} catch (error) {
  if (error instanceof StorageError) {
    console.error('存储错误:', error.message);
    console.error('错误代码:', error.code);
  }
}
```

## 开发指南

### 添加新的存储项

1. 在 `config/storage.config.ts` 中添加新的存储键
2. 更新相关的类型定义
3. 在需要的地方使用新添加的存储键

### 版本升级

当进行不兼容的更改时:

1. 更新 `storageConfig.version.current`
2. 如果需要,更新 `storageConfig.version.minimum`
3. 在 CHANGELOG.md 中记录更改
4. 更新相关测试用例

## 测试

运行单元测试:

```bash
npm run test
```

## 贡献

1. Fork 本仓库
2. 创建特性分支
3. 提交更改
4. 创建 Pull Request

## 许可证

MIT 