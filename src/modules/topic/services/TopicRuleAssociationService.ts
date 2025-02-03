import { BaseStorageService } from '../../storage/services/BaseStorageService';
import { 
  TopicRuleAssociation, 
  CreateAssociationParams, 
  UpdateAssociationParams,
  AssociationFilter,
  AssociationQueryResult,
  TypeValidation
} from '../types/association';
import { associationSchema, validateTypeMatch } from '../validation/association.schema';
import { Topic } from '../types';
import { Rules } from '../../rules/types';
import { StorageError, StorageErrorCode } from '../../storage/types/error';

export class TopicRuleAssociationService extends BaseStorageService<TopicRuleAssociation> {
  protected storageKey = 'topic_rule_associations';
  protected schema = associationSchema;

  constructor(
    private topicService: BaseStorageService<Topic>,
    private ruleService: BaseStorageService<Rules>
  ) {
    super();
  }

  /**
   * 创建主题-规则关联
   */
  async createAssociation(params: CreateAssociationParams): Promise<string> {
    // 验证主题和规则是否存在
    const [topic, rule] = await Promise.all([
      this.topicService.getById(params.topicId),
      this.ruleService.getById(params.ruleId)
    ]);

    if (!topic || !rule) {
      throw new StorageError(
        '主题或规则不存在',
        StorageErrorCode.NOT_FOUND_ERROR
      );
    }

    // 验证类型匹配
    const typeValidation: TypeValidation = {
      isTypeMatched: validateTypeMatch(topic.type, rule.format),
      matchDetails: {
        topicType: topic.type,
        ruleFormat: rule.format,
      },
    };

    // 如果设置为默认规则，需要取消其他默认规则
    if (params.isDefault) {
      await this.clearDefaultRule(params.topicId);
    }

    // 创建关联
    const association: TopicRuleAssociation = {
      ...params,
      typeValidation,
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.create(association);
    return association.id;
  }

  /**
   * 更新主题-规则关联
   */
  async updateAssociation(id: string, params: UpdateAssociationParams): Promise<void> {
    const association = await this.getById(id);
    if (!association) {
      throw new StorageError(
        '关联不存在',
        StorageErrorCode.NOT_FOUND_ERROR
      );
    }

    // 如果更新了主题或规则ID，需要重新验证类型匹配
    if (params.topicId || params.ruleId) {
      const topic = await this.topicService.getById(params.topicId || association.topicId);
      const rule = await this.ruleService.getById(params.ruleId || association.ruleId);

      if (!topic || !rule) {
        throw new StorageError(
          '主题或规则不存在',
          StorageErrorCode.NOT_FOUND_ERROR
        );
      }

      params.typeValidation = {
        isTypeMatched: validateTypeMatch(topic.type, rule.format),
        matchDetails: {
          topicType: topic.type,
          ruleFormat: rule.format,
        },
      };
    }

    // 如果设置为默认规则，需要取消其他默认规则
    if (params.isDefault) {
      await this.clearDefaultRule(association.topicId);
    }

    await this.update(id, params);
  }

  /**
   * 删除主题-规则关联
   */
  async deleteAssociation(id: string): Promise<void> {
    await this.delete(id);
  }

  /**
   * 获取主题的默认规则
   */
  async getDefaultRule(topicId: string): Promise<TopicRuleAssociation | null> {
    const associations = await this.query({
      topicId,
      isDefault: true,
    });
    return associations.items[0] || null;
  }

  /**
   * 清除主题的默认规则
   */
  private async clearDefaultRule(topicId: string): Promise<void> {
    const defaultRule = await this.getDefaultRule(topicId);
    if (defaultRule) {
      await this.update(defaultRule.id, { isDefault: false });
    }
  }

  /**
   * 查询主题-规则关联
   */
  async query(filter: AssociationFilter): Promise<AssociationQueryResult> {
    const associations = await this.getAll();
    
    const filtered = associations.filter(association => {
      if (filter.topicId && association.topicId !== filter.topicId) return false;
      if (filter.ruleId && association.ruleId !== filter.ruleId) return false;
      if (filter.isDefault !== undefined && association.isDefault !== filter.isDefault) return false;
      if (filter.isMatched !== undefined && association.typeValidation.isTypeMatched !== filter.isMatched) return false;
      return true;
    });

    return {
      total: filtered.length,
      items: filtered,
    };
  }

  /**
   * 验证主题和规则的类型匹配
   */
  async validateAssociation(topicId: string, ruleId: string): Promise<TypeValidation> {
    const [topic, rule] = await Promise.all([
      this.topicService.getById(topicId),
      this.ruleService.getById(ruleId)
    ]);

    if (!topic || !rule) {
      throw new StorageError(
        '主题或规则不存在',
        StorageErrorCode.NOT_FOUND_ERROR
      );
    }

    return {
      isTypeMatched: validateTypeMatch(topic.type, rule.format),
      matchDetails: {
        topicType: topic.type,
        ruleFormat: rule.format,
      },
    };
  }
} 