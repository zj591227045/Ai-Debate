import { IndexedDBConfig } from '../types';

export const DATABASE_VERSION = 1;

export const DATABASE_CONFIG: IndexedDBConfig = {
  dbName: 'ai_debate_db',
  version: DATABASE_VERSION,
  stores: {
    character_profiles: 'id,name,isTemplate,templateId,createdAt,updatedAt',
    character_templates: 'id,name,createdAt,updatedAt',
    game_rules: 'id,name,isDefault,version,createdAt,updatedAt',
    scoring_templates: 'id,name,createdAt,updatedAt',
    model_configs: 'id,provider,model,isDefault,isEnabled,createdAt,updatedAt',
    provider_configs: 'id,name,isEnabled',
    debate_history: 'id,topicId,createdAt,updatedAt'
  }
};

// 定义表的复合索引
export const COMPOUND_INDEXES = {
  character_profiles: [
    ['isTemplate', 'createdAt'],
    ['templateId', 'createdAt']
  ],
  model_configs: [
    ['isEnabled', 'provider'],
    ['isDefault', 'provider']
  ],
  game_rules: [
    ['isDefault', 'version']
  ]
};

// 定义默认的排序方式
export const DEFAULT_SORT = {
  character_profiles: { field: 'createdAt', direction: 'desc' },
  character_templates: { field: 'createdAt', direction: 'desc' },
  game_rules: { field: 'createdAt', direction: 'desc' },
  scoring_templates: { field: 'createdAt', direction: 'desc' },
  model_configs: { field: 'createdAt', direction: 'desc' },
  provider_configs: { field: 'name', direction: 'asc' },
  debate_history: { field: 'createdAt', direction: 'desc' }
} as const; 