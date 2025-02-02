<script setup lang="ts">
import { ref } from 'vue';
import { storage } from '../index';
import type { BackupMeta } from '../types';

const isLoading = ref(false);
const backupInfo = ref<{
  isValid: boolean;
  meta: BackupMeta | null;
  errors: string[];
} | null>(null);

const handleCreateBackup = async () => {
  try {
    isLoading.value = true;
    await storage.backup.downloadBackup();
  } catch (error) {
    console.error('备份创建失败:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  try {
    isLoading.value = true;
    backupInfo.value = await storage.backup.validateBackup(file);
  } catch (error) {
    console.error('备份验证失败:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleRestore = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  try {
    isLoading.value = true;
    await storage.backup.restoreFromBackup(file);
    backupInfo.value = null;
  } catch (error) {
    console.error('备份恢复失败:', error);
  } finally {
    isLoading.value = false;
    input.value = ''; // 重置文件输入
  }
};
</script>

<template>
  <div class="backup-manager">
    <div class="actions">
      <button 
        class="btn primary" 
        @click="handleCreateBackup"
        :disabled="isLoading"
      >
        {{ isLoading ? '处理中...' : '创建备份' }}
      </button>

      <div class="file-upload">
        <input
          type="file"
          accept=".json"
          @change="handleFileSelect"
          :disabled="isLoading"
          id="backup-file"
        />
        <label for="backup-file" class="btn secondary">
          选择备份文件
        </label>
      </div>
    </div>

    <div v-if="backupInfo" class="backup-info">
      <h3>备份文件信息</h3>
      <div class="status" :class="{ valid: backupInfo.isValid }">
        状态: {{ backupInfo.isValid ? '有效' : '无效' }}
      </div>

      <div v-if="backupInfo.meta" class="meta-info">
        <p>创建时间: {{ new Date(backupInfo.meta.timestamp).toLocaleString() }}</p>
        <p>版本: {{ backupInfo.meta.version }}</p>
        <p>大小: {{ (backupInfo.meta.size / 1024).toFixed(2) }} KB</p>
        <div class="contents">
          <h4>包含内容:</h4>
          <ul>
            <li v-for="(has, key) in backupInfo.meta.contents" :key="key">
              {{ key }}: {{ has ? '✓' : '✗' }}
            </li>
          </ul>
        </div>
      </div>

      <div v-if="backupInfo.errors.length" class="errors">
        <h4>错误信息:</h4>
        <ul>
          <li v-for="(error, index) in backupInfo.errors" :key="index">
            {{ error }}
          </li>
        </ul>
      </div>

      <button
        v-if="backupInfo.isValid"
        class="btn primary"
        @click="handleRestore"
        :disabled="isLoading"
      >
        恢复此备份
      </button>
    </div>
  </div>
</template>

<style scoped>
.backup-manager {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.actions {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.primary {
  background-color: #4CAF50;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background-color: #45a049;
}

.btn.secondary {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
}

.btn.secondary:hover:not(:disabled) {
  background-color: #e8e8e8;
}

.file-upload input[type="file"] {
  display: none;
}

.backup-info {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.status {
  margin: 12px 0;
  padding: 8px;
  border-radius: 4px;
  background-color: #ffebee;
  color: #c62828;
}

.status.valid {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.meta-info {
  margin: 16px 0;
}

.meta-info p {
  margin: 8px 0;
  color: #666;
}

.contents {
  margin-top: 16px;
}

.contents ul {
  list-style: none;
  padding: 0;
}

.contents li {
  margin: 4px 0;
  color: #666;
}

.errors {
  margin-top: 16px;
  color: #c62828;
}

.errors ul {
  list-style: none;
  padding: 0;
}

.errors li {
  margin: 4px 0;
}
</style> 