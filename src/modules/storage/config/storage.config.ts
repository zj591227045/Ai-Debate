import { StorageConfig, IndexedDBConfig, BackupConfig } from '../types';

// 存储配置
export const storageConfig: StorageConfig = {
  storageKeys: {
    playerProfiles: 'ai_debate_players',
    debateHistory: 'ai_debate_history',
    userPreferences: 'ai_debate_preferences',
    currentDebate: 'ai_debate_current',
    modelConfig: 'ai_debate_models',
    characterConfig: 'ai_debate_characters',
  },
  limits: {
    maxPlayerProfiles: 50,
    maxDebateHistory: 100,
    maxStorageSize: 10 * 1024 * 1024, // 10MB
  },
  version: {
    current: '1.0.0',
    minimum: '1.0.0',
  },
};

// IndexedDB配置
export const indexedDBConfig: IndexedDBConfig = {
  dbName: 'AIDebateDB',
  version: 1,
  stores: {
    debates: 'id, date, topic',
    speeches: 'id, debateId, playerId',
    players: 'id, name',
    backups: 'id, timestamp',
    characters: 'id, name, isTemplate, templateId',
  },
};

// 备份配置
export const backupConfig: BackupConfig = {
  autoBackup: {
    enabled: true,
    interval: 24 * 60 * 60 * 1000, // 24小时
    maxBackups: 5,
  },
  compression: true,
  encryption: false, // 暂时不启用加密
}; 