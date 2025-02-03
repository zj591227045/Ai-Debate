// 导出类型
export * from './types/debate';

// 导出验证模式
export * from './schemas/debate';

// 导入服务类
import { DebateConfigService } from './services/DebateConfigService';
import { TopicTemplateService } from './services/TopicTemplateService';
import { RulesConfigService } from './services/RulesConfigService';

// 创建服务实例
const debateConfigService = new DebateConfigService();
const topicTemplateService = new TopicTemplateService();
const rulesConfigService = new RulesConfigService();

// 导出服务实例
export const storage = {
  debate: debateConfigService,
  topic: topicTemplateService,
  rules: rulesConfigService,
};

// 导出服务类型（用于类型声明）
export type { 
  DebateConfigService,
  TopicTemplateService,
  RulesConfigService,
}; 