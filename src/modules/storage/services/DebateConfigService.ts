import { BaseStorageService } from './BaseStorageService';
import { generateId } from '../utils';
import { DebateTemplate, CreateTemplateParams, UpdateTemplateParams } from '../types/debate';
import { 
  DebateTemplateSchema, 
  CreateTemplateSchema, 
  UpdateTemplateSchema 
} from '../schemas/debate';

export class DebateConfigService {
  private templates: BaseStorageService<DebateTemplate>;

  constructor() {
    this.templates = new class extends BaseStorageService<DebateTemplate> {
      protected storageKey = 'debate_templates';
      protected schema = DebateTemplateSchema;
    };
  }

  /**
   * 添加新的辩论模板
   * @throws {Error} 当数据验证失败时
   */
  async addTemplate(params: CreateTemplateParams): Promise<string> {
    // 验证输入数据
    CreateTemplateSchema.parse(params);
    
    const now = Date.now();
    const template: DebateTemplate = {
      ...params,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };

    await this.templates.create(template);
    return template.id;
  }

  /**
   * 获取指定ID的模板
   */
  async getTemplate(id: string): Promise<DebateTemplate | null> {
    return this.templates.getById(id);
  }

  /**
   * 更新模板
   * @throws {Error} 当模板不存在或数据验证失败时
   */
  async updateTemplate(id: string, params: UpdateTemplateParams): Promise<void> {
    const existing = await this.templates.getById(id);
    if (!existing) {
      throw new Error('模板不存在');
    }

    // 验证更新数据
    UpdateTemplateSchema.partial().parse(params);

    // 合并现有数据和更新数据进行完整性验证
    const merged = {
      ...existing,
      ...params,
      content: params.content ? {
        ...existing.content,
        ...params.content,
        topic: params.content.topic ? {
          ...existing.content.topic,
          ...params.content.topic
        } : existing.content.topic,
        rules: params.content.rules ? {
          ...existing.content.rules,
          ...params.content.rules
        } : existing.content.rules
      } : existing.content,
      updatedAt: Date.now()
    };

    // 验证合并后的完整数据
    DebateTemplateSchema.parse(merged);

    await this.templates.update(id, params);
  }

  /**
   * 删除模板
   */
  async deleteTemplate(id: string): Promise<void> {
    await this.templates.delete(id);
  }

  /**
   * 获取所有模板
   */
  async listTemplates(): Promise<DebateTemplate[]> {
    return this.templates.getAll();
  }
} 