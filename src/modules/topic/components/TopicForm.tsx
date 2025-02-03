import React, { useState, useCallback } from 'react';
import { CreateTopicParams, TopicFormState, TopicValidationError, TopicType, DebateType } from '../types';
import { createTopicSchema } from '../validation/schemas';
import { Button, Input, Select, TextArea, TagInput } from '../../common/components';
import { useToast } from '../../common/hooks/useToast';

interface TopicFormProps {
  initialData?: Partial<CreateTopicParams>;
  onSubmit: (data: CreateTopicParams) => Promise<void>;
  onCancel?: () => void;
}

const initialFormState: TopicFormState = {
  topic: {
    title: '',
    description: '',
    background: '',
    type: 'policy',
    debateType: 'binary',
    isTemplate: false,
    tags: [],
  },
  errors: [],
  isDirty: false,
  isSubmitting: false,
};

export const TopicForm: React.FC<TopicFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [formState, setFormState] = useState<TopicFormState>(() => ({
    ...initialFormState,
    topic: { ...initialFormState.topic, ...initialData },
  }));

  const { showToast } = useToast();

  const validateField = useCallback((field: keyof CreateTopicParams, value: any): TopicValidationError[] => {
    try {
      createTopicSchema.shape[field].parse(value);
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

  const handleChange = useCallback((field: keyof CreateTopicParams, value: any) => {
    setFormState(prev => ({
      ...prev,
      topic: {
        ...prev.topic,
        [field]: value,
      },
      errors: validateField(field, value),
      isDirty: true,
    }));
  }, [validateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validData = createTopicSchema.parse(formState.topic);
      setFormState(prev => ({ ...prev, isSubmitting: true }));
      await onSubmit(validData);
      showToast('主题保存成功', 'success');
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error');
      }
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          label="辩题"
          value={formState.topic.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('title', e.target.value)}
          error={formState.errors.find(e => e.field === 'title')?.message}
          required
        />
      </div>

      <div>
        <TextArea
          label="描述"
          value={formState.topic.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
          error={formState.errors.find(e => e.field === 'description')?.message}
          required
        />
      </div>

      <div>
        <TextArea
          label="背景资料"
          value={formState.topic.background || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('background', e.target.value)}
          error={formState.errors.find(e => e.field === 'background')?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="主题类型"
          value={formState.topic.type}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('type', e.target.value as TopicType)}
          error={formState.errors.find(e => e.field === 'type')?.message}
          required
        >
          <option value="policy">政策类</option>
          <option value="value">价值类</option>
          <option value="fact">事实类</option>
        </Select>

        <Select
          label="辩论类型"
          value={formState.topic.debateType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('debateType', e.target.value as DebateType)}
          error={formState.errors.find(e => e.field === 'debateType')?.message}
          required
        >
          <option value="binary">二元对立</option>
          <option value="multi">多方观点</option>
        </Select>
      </div>

      <div>
        <TagInput
          label="标签"
          tags={formState.topic.tags}
          onChange={tags => handleChange('tags', tags)}
          error={formState.errors.find(e => e.field === 'tags')?.message}
        />
      </div>

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