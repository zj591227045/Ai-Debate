import React, { useState, useCallback } from 'react';
import { CreateRulesParams, RulesFormState, RulesValidationError, DebateFormat } from '../types';
import { createRulesSchema } from '../validation/schemas';
import { Button, Input, Select, TextArea, Switch, NumberInput } from '../../common/components';
import { useToast } from '../../common/hooks/useToast';

interface RulesFormProps {
  initialData?: Partial<CreateRulesParams>;
  onSubmit: (data: CreateRulesParams) => Promise<void>;
  onCancel?: () => void;
}

const initialFormState: RulesFormState = {
  rules: {
    name: '',
    description: '',
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
  },
  errors: [],
  isDirty: false,
  isSubmitting: false,
};

export const RulesForm: React.FC<RulesFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [formState, setFormState] = useState<RulesFormState>(() => ({
    ...initialFormState,
    rules: { ...initialFormState.rules, ...initialData },
  }));

  const { showToast } = useToast();

  const validateField = useCallback((field: keyof CreateRulesParams, value: any): RulesValidationError[] => {
    try {
      createRulesSchema.shape[field].parse(value);
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

  const handleChange = useCallback((field: keyof CreateRulesParams, value: any) => {
    setFormState(prev => ({
      ...prev,
      rules: {
        ...prev.rules,
        [field]: value,
      },
      errors: validateField(field, value),
      isDirty: true,
    }));
  }, [validateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validData = createRulesSchema.parse(formState.rules);
      setFormState(prev => ({ ...prev, isSubmitting: true }));
      await onSubmit(validData);
      showToast('规则保存成功', 'success');
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
      {/* 基本信息 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">基本信息</h3>
        <Input
          label="规则名称"
          value={formState.rules.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
          error={formState.errors.find(e => e.field === 'name')?.message}
          required
        />
        <TextArea
          label="规则说明"
          value={formState.rules.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
          error={formState.errors.find(e => e.field === 'description')?.message}
        />
        <Select
          label="辩论形式"
          value={formState.rules.format}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('format', e.target.value as DebateFormat)}
          error={formState.errors.find(e => e.field === 'format')?.message}
          required
        >
          <option value="structured">结构化辩论</option>
          <option value="free">自由辩论</option>
        </Select>
      </div>

      {/* 基础规则 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">基础规则</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberInput
            label="最大字数"
            value={formState.rules.speechRules.maxLength}
            onChange={value => handleChange('speechRules', {
              ...formState.rules.speechRules,
              maxLength: value,
            })}
            min={1}
            error={formState.errors.find(e => e.field === 'speechRules.maxLength')?.message}
            required
          />
          <NumberInput
            label="最小字数"
            value={formState.rules.speechRules.minLength}
            onChange={value => handleChange('speechRules', {
              ...formState.rules.speechRules,
              minLength: value,
            })}
            min={0}
            error={formState.errors.find(e => e.field === 'speechRules.minLength')?.message}
            required
          />
          <NumberInput
            label="时间限制（秒）"
            value={formState.rules.speechRules.timeLimit}
            onChange={value => handleChange('speechRules', {
              ...formState.rules.speechRules,
              timeLimit: value,
            })}
            min={30}
            error={formState.errors.find(e => e.field === 'speechRules.timeLimit')?.message}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Switch
            label="允许空发言"
            checked={formState.rules.speechRules.allowEmpty}
            onChange={checked => handleChange('speechRules', {
              ...formState.rules.speechRules,
              allowEmpty: checked,
            })}
          />
          <Switch
            label="允许重复发言"
            checked={formState.rules.speechRules.allowRepeat}
            onChange={checked => handleChange('speechRules', {
              ...formState.rules.speechRules,
              allowRepeat: checked,
            })}
          />
        </div>
      </div>

      {/* 高级规则 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">高级规则</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Switch
            label="允许引用"
            checked={formState.rules.advancedRules.allowQuoting}
            onChange={checked => handleChange('advancedRules', {
              ...formState.rules.advancedRules,
              allowQuoting: checked,
            })}
          />
          <Switch
            label="必须回应前一个观点"
            checked={formState.rules.advancedRules.requireResponse}
            onChange={checked => handleChange('advancedRules', {
              ...formState.rules.advancedRules,
              requireResponse: checked,
            })}
          />
          <Switch
            label="允许改变立场"
            checked={formState.rules.advancedRules.allowStanceChange}
            onChange={checked => handleChange('advancedRules', {
              ...formState.rules.advancedRules,
              allowStanceChange: checked,
            })}
          />
          <Switch
            label="要求提供论据"
            checked={formState.rules.advancedRules.requireEvidence}
            onChange={checked => handleChange('advancedRules', {
              ...formState.rules.advancedRules,
              requireEvidence: checked,
            })}
          />
        </div>
      </div>

      {/* 评分规则 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">评分规则</h3>
        <div className="space-y-4">
          {Object.entries(formState.rules.scoring.dimensions).map(([key, value]) => (
            <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberInput
                label={`${key} 权重`}
                value={value.weight}
                onChange={weight => handleChange('scoring', {
                  ...formState.rules.scoring,
                  dimensions: {
                    ...formState.rules.scoring.dimensions,
                    [key]: { ...value, weight },
                  },
                })}
                min={0}
                max={100}
                error={formState.errors.find(e => e.field === `scoring.dimensions.${key}.weight`)?.message}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(formState.rules.scoring.bonusPoints).map(([key, value]) => (
            <NumberInput
              key={key}
              label={`${key} 加分`}
              value={value}
              onChange={points => handleChange('scoring', {
                ...formState.rules.scoring,
                bonusPoints: {
                  ...formState.rules.scoring.bonusPoints,
                  [key]: points,
                },
              })}
              min={0}
              error={formState.errors.find(e => e.field === `scoring.bonusPoints.${key}`)?.message}
            />
          ))}
        </div>
      </div>

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