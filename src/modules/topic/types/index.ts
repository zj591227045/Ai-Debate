import { BaseEntity } from '../../storage/validation/schemas/base.schema';

// 主题类型
export type TopicType = 'policy' | 'value' | 'fact';

// 辩论类型
export type DebateType = 'binary' | 'multi';

// 主题接口
export interface Topic extends BaseEntity {
  title: string;            // 辩题
  description: string;      // 主题描述
  background?: string;      // 背景资料
  type: TopicType;         // 主题类型：政策类/价值类/事实类
  debateType: DebateType;  // 辩论类型：二元对立/多方观点
  isTemplate: boolean;      // 是否为模板
  templateId?: string;      // 基于哪个模板创建（如果有）
  usageCount: number;       // 使用次数
  lastUsed?: number;        // 最后使用时间
  tags: string[];          // 主题标签
  version: number;         // 版本号
  isLatest: boolean;       // 是否为最新版本
  previousVersions?: string[]; // 历史版本ID
}

// 创建主题参数
export type CreateTopicParams = Omit<Topic, keyof BaseEntity | 'usageCount' | 'lastUsed' | 'version' | 'isLatest' | 'previousVersions'>;

// 更新主题参数
export type UpdateTopicParams = Partial<CreateTopicParams>;

// 主题验证错误
export interface TopicValidationError {
  field: keyof Topic;
  message: string;
}

// 主题表单状态
export interface TopicFormState {
  topic: CreateTopicParams;
  errors: TopicValidationError[];
  isDirty: boolean;
  isSubmitting: boolean;
}