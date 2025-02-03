import React, { useState, useCallback } from 'react';
import { TextArea } from '../../common/components';
import { useToast } from '../../common/hooks/useToast';
import { createTopicSchema } from '../validation/schemas';

interface BackgroundEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => Promise<void>;
  error?: string;
  maxLength?: number;
}

export const BackgroundEditor: React.FC<BackgroundEditorProps> = ({
  value,
  onChange,
  onSave,
  error,
  maxLength = 5000,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  }, [onChange, maxLength]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;

    try {
      setIsSaving(true);
      // 验证背景资料
      createTopicSchema.shape.background.parse(value);
      await onSave(value);
      setIsEditing(false);
      showToast('背景资料保存成功', 'success');
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  }, [value, onSave, showToast]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">背景资料</h3>
        <div className="space-x-2">
          {isEditing ? (
            <>
              <button
                type="button"
                className="px-3 py-1 text-sm rounded-md bg-primary text-white"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                className="px-3 py-1 text-sm rounded-md bg-gray-200"
                onClick={handleCancel}
                disabled={isSaving}
              >
                取消
              </button>
            </>
          ) : (
            <button
              type="button"
              className="px-3 py-1 text-sm rounded-md bg-gray-200"
              onClick={() => setIsEditing(true)}
            >
              编辑
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <TextArea
            value={value}
            onChange={handleChange}
            error={error}
            placeholder="请输入背景资料..."
            rows={10}
          />
          <div className="text-right text-sm text-gray-500">
            {value.length}/{maxLength}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
          {value || '暂无背景资料'}
        </div>
      )}
    </div>
  );
}; 