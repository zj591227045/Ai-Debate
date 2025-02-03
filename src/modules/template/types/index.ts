import { BaseEntity } from '../../storage/validation/schemas/base.schema';
import { Topic } from '../../topic/types';
import { Rules } from '../../rules/types';
import { FormData, FormState, NestedFormData, CreateFormData, UpdateFormData } from '../../common/types/form';

// 模板内容类型
export interface TemplateContent {
  topic: Topic;
  rules: Rules;
}

// 模板类型
export interface Template extends BaseEntity {
  name: string;              // 模板名称
  description?: string;      // 模板描述
  content: TemplateContent;  // 模板内容
  category: string;         // 分类
  tags: string[];          // 标签
  isPreset: boolean;       // 是否为预设模板
  isEditable: boolean;     // 是否可编辑
  usageCount: number;      // 使用次数
  lastUsed?: number;       // 最后使用时间
}

// 模板表单内容类型
export interface TemplateFormContent {
  topic: FormData<Topic>;
  rules: FormData<Rules>;
}

// 创建模板参数
export interface CreateTemplateParams extends Omit<FormData<Template>, 'content'> {
  content: TemplateFormContent;
}

// 更新模板参数
export type UpdateTemplateParams = Partial<CreateTemplateParams>;

// 模板验证错误
export interface TemplateValidationError {
  field: keyof CreateTemplateParams | string;
  message: string;
}

// 模板表单状态
export interface TemplateFormState {
  template: CreateTemplateParams;
  errors: TemplateValidationError[];
  isDirty: boolean;
  isSubmitting: boolean;
}

// 模板列表项
export interface TemplateListItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  isPreset: boolean;
  isEditable: boolean;
  usageCount: number;
  lastUsed?: number;
  createdAt: number;
  updatedAt: number;
}

// 模板过滤器
export interface TemplateFilter {
  search?: string;
  category?: string;
  tags?: string[];
  isPreset?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsed';
  sortOrder?: 'asc' | 'desc';
}

// 模板分类
export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  order: number;
  count: number;
}

// 模板标签
export interface TemplateTag {
  id: string;
  name: string;
  count: number;
} 