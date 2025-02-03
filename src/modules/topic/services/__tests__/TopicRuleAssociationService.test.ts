import { TopicRuleAssociationService } from '../TopicRuleAssociationService';
import { BaseStorageService } from '../../../storage/services/BaseStorageService';
import { Topic } from '../../types';
import { Rules } from '../../../rules/types';
import { StorageError, StorageErrorCode } from '../../../storage/types/error';

describe('TopicRuleAssociationService', () => {
  let service: TopicRuleAssociationService;
  let mockTopicService: jest.Mocked<BaseStorageService<Topic>>;
  let mockRuleService: jest.Mocked<BaseStorageService<Rules>>;

  const mockTopic: Topic = {
    id: 'topic-1',
    title: '测试主题',
    description: '测试描述',
    type: 'policy',
    debateType: 'binary',
    isTemplate: false,
    tags: [],
    version: 1,
    isLatest: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  };

  const mockRule: Rules = {
    id: 'rule-1',
    name: '测试规则',
    format: 'structured',
    speechRules: {
      maxLength: 500,
      minLength: 100,
      allowEmpty: false,
      allowRepeat: false,
    },
    advancedRules: {
      allowQuoting: true,
      requireResponse: true,
      allowStanceChange: false,
      requireEvidence: true,
      argumentTypes: ['factual'],
    },
    scoring: {
      dimensions: {
        logic: { weight: 30, criteria: ['论证完整性'] },
        naturalness: { weight: 20, criteria: ['表达流畅性'] },
        compliance: { weight: 20, criteria: ['规则遵守度'] },
        consistency: { weight: 15, criteria: ['立场一致性'] },
        responsiveness: { weight: 15, criteria: ['回应相关性'] },
      },
      bonusPoints: {
        innovation: 5,
        persuasiveness: 5,
        clarity: 5,
      },
    },
    version: '1.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    mockTopicService = {
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getAll: jest.fn(),
    } as any;

    mockRuleService = {
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getAll: jest.fn(),
    } as any;

    service = new TopicRuleAssociationService(mockTopicService, mockRuleService);
  });

  describe('createAssociation', () => {
    it('should create association when types match', async () => {
      mockTopicService.getById.mockResolvedValue(mockTopic);
      mockRuleService.getById.mockResolvedValue(mockRule);

      const params = {
        topicId: 'topic-1',
        ruleId: 'rule-1',
        isDefault: true,
      };

      const id = await service.createAssociation(params);

      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('should throw error when topic not found', async () => {
      mockTopicService.getById.mockResolvedValue(null);
      mockRuleService.getById.mockResolvedValue(mockRule);

      const params = {
        topicId: 'non-existent',
        ruleId: 'rule-1',
        isDefault: true,
      };

      await expect(service.createAssociation(params)).rejects.toThrow(StorageError);
    });

    it('should throw error when rule not found', async () => {
      mockTopicService.getById.mockResolvedValue(mockTopic);
      mockRuleService.getById.mockResolvedValue(null);

      const params = {
        topicId: 'topic-1',
        ruleId: 'non-existent',
        isDefault: true,
      };

      await expect(service.createAssociation(params)).rejects.toThrow(StorageError);
    });
  });

  describe('updateAssociation', () => {
    it('should update association', async () => {
      const existingAssociation = {
        id: 'assoc-1',
        topicId: 'topic-1',
        ruleId: 'rule-1',
        isDefault: false,
        typeValidation: {
          isTypeMatched: true,
          matchDetails: {
            topicType: 'policy',
            ruleFormat: 'structured',
          },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      jest.spyOn(service, 'getById').mockResolvedValue(existingAssociation);
      mockTopicService.getById.mockResolvedValue(mockTopic);
      mockRuleService.getById.mockResolvedValue(mockRule);

      await service.updateAssociation('assoc-1', { isDefault: true });

      expect(service.update).toHaveBeenCalled();
    });

    it('should throw error when association not found', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(null);

      await expect(service.updateAssociation('non-existent', { isDefault: true }))
        .rejects.toThrow(StorageError);
    });
  });

  describe('validateAssociation', () => {
    it('should validate type match correctly', async () => {
      mockTopicService.getById.mockResolvedValue(mockTopic);
      mockRuleService.getById.mockResolvedValue(mockRule);

      const result = await service.validateAssociation('topic-1', 'rule-1');

      expect(result.isTypeMatched).toBe(true);
      expect(result.matchDetails).toEqual({
        topicType: 'policy',
        ruleFormat: 'structured',
      });
    });

    it('should validate type mismatch correctly', async () => {
      const mismatchTopic = {
        ...mockTopic,
        type: 'value',
      };
      mockTopicService.getById.mockResolvedValue(mismatchTopic);
      mockRuleService.getById.mockResolvedValue(mockRule);

      const result = await service.validateAssociation('topic-1', 'rule-1');

      expect(result.isTypeMatched).toBe(false);
    });
  });
}); 