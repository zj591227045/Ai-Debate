import { BaseStorageService } from './BaseStorageService';
import { generateId } from '../utils';
import { TopicConfig } from '../types/debate';
import { TopicConfigSchema } from '../schemas/debate';

export class TopicTemplateService extends BaseStorageService<TopicConfig> {
  protected storageKey = 'topic_templates';
  protected schema = TopicConfigSchema;

  /**
   * 创建新的主题模板
   */
  async createTemplate(params: Omit<TopicConfig, 'id'>): Promise<string> {
    const now = Date.now();
    const template: TopicConfig = {
      ...params,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };

    await this.create(template);
    return template.id;
  }

  /**
   * 获取指定类型的主题模板
   */
  async getTemplatesByType(type: 'binary' | 'multi'): Promise<TopicConfig[]> {
    const templates = await this.getAll();
    return templates.filter(template => template.type === type);
  }

  /**
   * 获取推荐的主题模板
   * @param count 返回的模板数量
   */
  async getRecommendedTemplates(count: number = 5): Promise<TopicConfig[]> {
    const templates = await this.getAll();
    // 这里可以根据需要实现推荐算法，目前简单返回最新的模板
    return templates
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, count);
  }

  /**
   * 搜索主题模板
   * @param keyword 搜索关键词
   */
  async searchTemplates(keyword: string): Promise<TopicConfig[]> {
    const templates = await this.getAll();
    const lowerKeyword = keyword.toLowerCase();
    
    return templates.filter(template => 
      template.title.toLowerCase().includes(lowerKeyword) ||
      template.description.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * 复制现有模板
   */
  async duplicateTemplate(id: string, newTitle?: string): Promise<string> {
    const template = await this.getById(id);
    if (!template) {
      throw new Error('模板不存在');
    }

    const now = Date.now();
    const newTemplate: TopicConfig = {
      ...template,
      id: generateId(),
      title: newTitle || `${template.title} (副本)`,
      createdAt: now,
      updatedAt: now
    };

    await this.create(newTemplate);
    return newTemplate.id;
  }
} 