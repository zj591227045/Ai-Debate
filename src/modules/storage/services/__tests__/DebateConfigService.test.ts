import { DebateConfigService } from '../DebateConfigService';
import { CreateTemplateParams } from '../../types/debate';

describe('DebateConfigService', () => {
  let service: DebateConfigService;
  
  // 测试数据
  const validTemplate: CreateTemplateParams = {
    name: "测试模板",
    content: {
      topic: {
        title: "人工智能是否会取代人类工作",
        description: "探讨AI发展对就业市场的影响和可能带来的社会变革",
        type: "binary"
      },
      rules: {
        format: "binary",
        speechRules: {
          maxLength: 1000,
          minLength: 100,
          timeLimit: 180
        }
      }
    }
  };

  beforeEach(() => {
    // 每个测试前重新创建服务实例
    service = new DebateConfigService();
    // 清理存储
    localStorage.clear();
  });

  describe('addTemplate', () => {
    it('should create a new template successfully', async () => {
      const id = await service.addTemplate(validTemplate);
      
      // 验证返回的ID
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');

      // 验证模板是否被正确存储
      const saved = await service.getTemplate(id);
      expect(saved).toBeTruthy();
      expect(saved?.name).toBe(validTemplate.name);
      expect(saved?.content.topic.title).toBe(validTemplate.content.topic.title);
    });

    it('should throw error when topic type and rule format do not match', async () => {
      const invalidTemplate = {
        ...validTemplate,
        content: {
          ...validTemplate.content,
          topic: {
            ...validTemplate.content.topic,
            type: 'binary'
          },
          rules: {
            ...validTemplate.content.rules,
            format: 'multi'
          }
        }
      };

      await expect(service.addTemplate(invalidTemplate)).rejects.toThrow('Topic type and rule format do not match');
    });

    it('should validate template data', async () => {
      const invalidTemplate = {
        ...validTemplate,
        name: 'ab' // 名称太短
      };

      await expect(service.addTemplate(invalidTemplate)).rejects.toThrow();
    });
  });

  describe('updateTemplate', () => {
    it('should update existing template', async () => {
      // 先创建一个模板
      const id = await service.addTemplate(validTemplate);

      // 更新模板
      const update = {
        name: "更新后的模板名称",
        content: {
          topic: {
            description: "更新后的描述"
          }
        }
      };

      await service.updateTemplate(id, update);

      // 验证更新结果
      const updated = await service.getTemplate(id);
      expect(updated?.name).toBe(update.name);
      expect(updated?.content.topic.description).toBe(update.content.topic.description);
      // 确保其他字段保持不变
      expect(updated?.content.topic.title).toBe(validTemplate.content.topic.title);
    });

    it('should throw error when template not found', async () => {
      await expect(service.updateTemplate('non-existent-id', { name: 'new name' }))
        .rejects.toThrow('Template not found');
    });

    it('should validate type matching on update', async () => {
      const id = await service.addTemplate(validTemplate);

      const invalidUpdate = {
        content: {
          topic: { type: 'binary' },
          rules: { format: 'multi' }
        }
      };

      await expect(service.updateTemplate(id, invalidUpdate))
        .rejects.toThrow('Topic type and rule format do not match');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template', async () => {
      const id = await service.addTemplate(validTemplate);
      await service.deleteTemplate(id);
      
      const deleted = await service.getTemplate(id);
      expect(deleted).toBeNull();
    });
  });

  describe('listTemplates', () => {
    it('should list all templates', async () => {
      // 创建多个模板
      await service.addTemplate(validTemplate);
      await service.addTemplate({
        ...validTemplate,
        name: "第二个模板"
      });

      const templates = await service.listTemplates();
      expect(templates.length).toBe(2);
    });

    it('should return empty array when no templates', async () => {
      const templates = await service.listTemplates();
      expect(templates).toEqual([]);
    });
  });
}); 