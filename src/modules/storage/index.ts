// 导出类型和配置
export * from './types';
export * from './config/storage.config';

// 导入服务类
import { LocalStorageService, IndexedDBService, BackupService } from './services';
import { CharacterConfigService } from './services/CharacterConfigService';

// 创建服务实例
const localStorageService = new LocalStorageService();
const indexedDBService = new IndexedDBService();
const backupService = new BackupService(localStorageService, indexedDBService);
const characterConfigService = new CharacterConfigService();

// 导出服务实例
export const storage = {
  local: localStorageService,
  indexedDB: indexedDBService,
  backup: backupService,
  character: characterConfigService,
};

// 导出服务类型（用于类型声明）
export type { 
  LocalStorageService, 
  IndexedDBService, 
  BackupService,
  CharacterConfigService,
}; 