import React, { useState, useCallback } from 'react';
import { CreateTemplateParams, TemplateFormState, TemplateValidationError } from '../types';
import { createTemplateSchema } from '../validation/schemas';
import { Button, Input, Select, TextArea } from '../../common/components';
import { TopicForm } from '../../topic/components/TopicForm';
import { RulesForm } from '../../rules/components/RulesForm';
import { useToast } from '../../common/hooks/useToast';
import { TopicType } from '../../topic/types';
import { createFormData, createNestedFormData } from '../../storage/utils/entityFactory';
import { Topic } from '../../topic/types';
import { Rules } from '../../rules/types';

interface TemplateFormProps {
  initialData?: Partial<CreateTemplateParams>;
  categories: { id: string; name: string }[];
  onSubmit: (data: CreateTemplateParams) => Promise<void>;
  onCancel?: () => void;
}

const initialFormState: TemplateFormState = {
  template: {
    name: '',
    description: '',
    content: {
      topic: createFormData<Topic>({
        title: '',
        description: '',
        type: 'policy',
        debateType: 'binary',
        isTemplate: false,
        tags: [],
        version: 1,
        isLatest: true,
      }),
      rules: createFormData<Rules>({
        name: '',
        format: 'structured',
        speechRules: {
          maxLength: 500,
          minLength: 100,
          allowEmpty: false,
          allowRepeat: false,
          timeLimit: 180,
        },
        advancedRules: {
          allowQuoting: true,
          requireResponse: true,
          allowStanceChange: false,
          requireEvidence: true,
          argumentTypes: ['factual', 'logical', 'example'],
        },
        scoring: {
          dimensions: {
            logic: { weight: 30, criteria: ['论证完整性', '推理严谨性'] },
            naturalness: { weight: 20, criteria: ['表达流畅性', '语言自然度'] },
            compliance: { weight: 20, criteria: ['规则遵守度', '格式规范性'] },
            consistency: { weight: 15, criteria: ['立场一致性', '观点连贯性'] },
            responsiveness: { weight: 15, criteria: ['回应相关性', '反驳有效性'] },
          },
          bonusPoints: {
            innovation: 5,
            persuasiveness: 5,
            clarity: 5,
          },
        },
        version: '1.0.0',
      }),
    },
    category: '',
    tags: [],
    isPreset: false,
    isEditable: true,
  },
  errors: [],
  isDirty: false,
  isSubmitting: false,
};

export const TemplateForm: React.FC<TemplateFormProps> = ({
  initialData,
  categories,
  onSubmit,
  onCancel,
}) => {
  const [formState, setFormState] = useState<TemplateFormState>(() => ({
    ...initialFormState,
    template: { ...initialFormState.template, ...initialData },
  }));

  const [activeTab, setActiveTab] = useState<'basic' | 'topic' | 'rules'>('basic');

  const { showToast } = useToast();

  const validateField = useCallback((field: keyof CreateTemplateParams, value: any): TemplateValidationError[] => {
    try {
      createTemplateSchema.shape[field].parse(value);
      return [];
    } catch (error) {
      if (error instanceof Error) {
        return [{
          field,
          message: error.message,
        }];
      }
      return [];
    }
  }, []);

  const handleChange = useCallback((field: keyof CreateTemplateParams, value: any) => {
    setFormState(prev => ({
      ...prev,
      template: {
        ...prev.template,
        [field]: value,
      },
      errors: validateField(field, value),
      isDirty: true,
    }));
  }, [validateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validData = createTemplateSchema.parse(formState.template);
      setFormState(prev => ({ ...prev, isSubmitting: true }));
      await onSubmit(validData);
      showToast('模板保存成功', 'success');
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error');
      }
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 标签页导航 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'basic', name: '基本信息' },
            { id: 'topic', name: '主题配置' },
            { id: 'rules', name: '规则配置' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* 基本信息 */}
      {activeTab === 'basic' && (
        <div className="space-y-4">
          <Input
            label="模板名称"
            value={formState.template.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
            error={formState.errors.find(e => e.field === 'name')?.message}
            required
          />
          <TextArea
            label="模板描述"
            value={formState.template.description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
            error={formState.errors.find(e => e.field === 'description')?.message}
          />
          <Select
            label="分类"
            value={formState.template.category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('category', e.target.value)}
            error={formState.errors.find(e => e.field === 'category')?.message}
            required
          >
            <option value="">请选择分类</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              标签
            </label>
            <div className="mt-1">
              <input
                type="text"
                className="form-input block w-full rounded-md"
                placeholder="输入标签，按回车添加"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.target as HTMLInputElement;
                    const tag = input.value.trim();
                    if (tag && !formState.template.tags.includes(tag)) {
                      handleChange('tags', [...formState.template.tags, tag]);
                      input.value = '';
                    }
                  }
                }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {formState.template.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100"
                >
                  {tag}
                  <button
                    type="button"
                    className="ml-1 text-gray-400 hover:text-gray-600"
                    onClick={() => handleChange('tags', formState.template.tags.filter(t => t !== tag))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 主题配置 */}
      {activeTab === 'topic' && (
        <TopicForm
          initialData={formState.template.content.topic}
          onSubmit={async topic => {
            handleChange('content', {
              ...formState.template.content,
              topic,
            });
          }}
        />
      )}

      {/* 规则配置 */}
      {activeTab === 'rules' && (
        <RulesForm
          initialData={formState.template.content.rules}
          onSubmit={async rules => {
            handleChange('content', {
              ...formState.template.content,
              rules,
            });
          }}
        />
      )}

      {/* 按钮组 */}
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={formState.isSubmitting}
          >
            取消
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={!formState.isDirty || formState.isSubmitting}
          loading={formState.isSubmitting}
        >
          保存
        </Button>
      </div>
    </form>
  );
}; 