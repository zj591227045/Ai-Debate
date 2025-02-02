import { StorageError, StorageErrorCodes, BackupMeta, TableNames } from '../types';
import { storageConfig } from '../config/storage.config';
import type { LocalStorageService } from './LocalStorageService';
import type { IndexedDBService } from './IndexedDBService';

interface BackupData {
  version: string;
  timestamp: number;
  localStorage: Record<string, Array<{ id: string } & Record<string, any>>>;
  indexedDB: Record<string, Array<{ id: string } & Record<string, any>>>;
}

interface BackupContent {
  meta: BackupMeta;
  data: BackupData;
}

type StorageItem = { id: string } & Record<string, any>;

export class BackupService {
  constructor(
    private localStorage: LocalStorageService,
    private indexedDB: IndexedDBService
  ) {}

  // 创建备份
  async createBackup(): Promise<Blob> {
    try {
      // 1. 收集所有需要备份的数据
      const backupData: BackupData = {
        version: storageConfig.version.current,
        timestamp: Date.now(),
        localStorage: {},
        indexedDB: {},
      };

      // 2. 备份 LocalStorage 数据
      for (const key of Object.values(storageConfig.storageKeys)) {
        const items = await this.localStorage.getAll<StorageItem>(key);
        if (items && items.length > 0) {
          backupData.localStorage[key] = items;
        }
      }

      // 3. 备份 IndexedDB 数据
      for (const table of Object.values(TableNames)) {
        const items = await this.indexedDB.getAll<StorageItem>(table);
        if (items && items.length > 0) {
          backupData.indexedDB[table] = items;
        }
      }

      // 4. 创建备份元数据
      const meta: BackupMeta = {
        id: `backup_${Date.now()}`,
        timestamp: Date.now(),
        version: storageConfig.version.current,
        size: 0,
        checksum: this.generateChecksum(backupData),
      };

      // 5. 将元数据添加到备份数据中
      const finalBackupData: BackupContent = {
        meta,
        data: backupData,
      };

      // 6. 转换为 Blob
      const backupBlob = new Blob(
        [JSON.stringify(finalBackupData, null, 2)],
        { type: 'application/json' }
      );

      // 7. 更新元数据中的大小
      meta.size = backupBlob.size;

      return backupBlob;
    } catch (error) {
      throw new StorageError(
        '创建备份失败',
        StorageErrorCodes.BACKUP_FAILED,
        false
      );
    }
  }

  // 从备份恢复
  async restoreFromBackup(backupFile: File): Promise<void> {
    try {
      // 1. 读取备份文件
      const backupContent = await this.readBackupFile(backupFile);
      const { meta, data } = backupContent as BackupContent;

      // 2. 验证备份版本
      this.validateBackupVersion(meta.version);

      // 3. 清除现有数据
      await this.clearExistingData();

      // 4. 恢复 LocalStorage 数据
      for (const [key, items] of Object.entries(data.localStorage)) {
        if (Array.isArray(items)) {
          for (const item of items) {
            if (this.isValidItem(item)) {
              await this.localStorage.set(key, item);
            }
          }
        }
      }

      // 5. 恢复 IndexedDB 数据
      for (const [store, items] of Object.entries(data.indexedDB)) {
        if (Array.isArray(items)) {
          for (const item of items) {
            if (this.isValidItem(item)) {
              await this.indexedDB.set(store, item);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        '恢复备份失败',
        StorageErrorCodes.RESTORE_FAILED,
        false
      );
    }
  }

  private isValidItem(item: unknown): item is StorageItem {
    return item !== null && 
           typeof item === 'object' && 
           'id' in item && 
           typeof (item as any).id === 'string';
  }

  private async clearExistingData(): Promise<void> {
    // 清除 LocalStorage 数据
    for (const key of Object.values(storageConfig.storageKeys)) {
      await this.localStorage.clear(key);
    }
    
    // 清除 IndexedDB 数据
    for (const table of Object.values(TableNames)) {
      await this.indexedDB.clear(table);
    }
  }

  // 验证备份文件
  async validateBackup(backupFile: File): Promise<{
    isValid: boolean;
    meta: BackupMeta | null;
    errors: string[];
  }> {
    try {
      const backupContent = await this.readBackupFile(backupFile);
      const errors: string[] = [];

      // 验证元数据
      if (!backupContent.meta) {
        errors.push('备份文件缺少元数据');
      }

      // 验证版本
      if (!this.isVersionCompatible(backupContent.meta.version)) {
        errors.push('备份版本不兼容');
      }

      // 验证数据完整性
      if (!backupContent.data) {
        errors.push('备份文件缺少数据');
      }

      return {
        isValid: errors.length === 0,
        meta: backupContent.meta,
        errors,
      };
    } catch (error) {
      return {
        isValid: false,
        meta: null,
        errors: ['备份文件格式无效'],
      };
    }
  }

  // 下载备份
  async downloadBackup(): Promise<void> {
    const backup = await this.createBackup();
    const url = URL.createObjectURL(backup);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_debate_backup_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private async readBackupFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          resolve(content);
        } catch (error) {
          reject(new StorageError(
            '备份文件格式无效',
            StorageErrorCodes.CORRUPTION,
            false
          ));
        }
      };
      reader.onerror = () => {
        reject(new StorageError(
          '读取备份文件失败',
          StorageErrorCodes.CORRUPTION,
          false
        ));
      };
      reader.readAsText(file);
    });
  }

  private validateBackupVersion(version: string): void {
    if (!this.isVersionCompatible(version)) {
      throw new StorageError(
        '备份版本不兼容',
        StorageErrorCodes.VERSION_MISMATCH,
        false
      );
    }
  }

  private isVersionCompatible(version: string): boolean {
    return version >= storageConfig.version.minimum;
  }

  private generateChecksum(data: any): string {
    // 简单的实现，实际应用中应该使用更强大的哈希算法
    return btoa(JSON.stringify(data));
  }
} 