import React, { useState, useCallback } from 'react';
import { TemplateTag } from '../types';
import { Button, Input } from '../../common/components';
import { useToast } from '../../common/hooks/useToast';

interface TagManagerProps {
  tags: TemplateTag[];
  onAdd: (name: string) => Promise<void>;
  onUpdate: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMerge: (sourceId: string, targetId: string) => Promise<void>;
}

export const TagManager: React.FC<TagManagerProps> = ({
  tags,
  onAdd,
  onUpdate,
  onDelete,
  onMerge,
}) => {
  const [newTagName, setNewTagName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mergeSource, setMergeSource] = useState<string | null>(null);

  const { showToast } = useToast();

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      setIsSubmitting(true);
      await onAdd(newTagName);
      setNewTagName('');
      showToast('标签添加成功', 'success');
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editingName.trim()) return;

    try {
      setIsSubmitting(true);
      await onUpdate(editingId, editingName);
      setEditingId(null);
      setEditingName('');
      showToast('标签更新成功', 'success');
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTag = async (id: string) => {
    try {
      await onDelete(id);
      showToast('标签删除成功', 'success');
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error');
      }
    }
  };

  const handleMergeTag = async (targetId: string) => {
    if (!mergeSource || mergeSource === targetId) return;

    try {
      await onMerge(mergeSource, targetId);
      setMergeSource(null);
      showToast('标签合并成功', 'success');
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 添加标签表单 */}
      <form onSubmit={handleAddTag} className="space-y-4">
        <Input
          label="新标签名称"
          value={newTagName}
          onChange={e => setNewTagName(e.target.value)}
          placeholder="输入新标签名称"
          required
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={!newTagName.trim() || isSubmitting}
            loading={isSubmitting}
          >
            添加标签
          </Button>
        </div>
      </form>

      {/* 标签列表 */}
      <div className="space-y-2">
        {tags.map(tag => (
          <div
            key={tag.id}
            className={`
              p-4 rounded-lg border
              ${mergeSource === tag.id ? 'bg-blue-50 border-blue-200' : 'bg-white'}
            `}
          >
            {editingId === tag.id ? (
              <form onSubmit={handleUpdateTag} className="flex items-center space-x-2">
                <Input
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!editingName.trim() || isSubmitting}
                  loading={isSubmitting}
                >
                  保存
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingId(null);
                    setEditingName('');
                  }}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{tag.name}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({tag.count} 个模板)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {mergeSource ? (
                    mergeSource !== tag.id && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleMergeTag(tag.id)}
                      >
                        合并到此标签
                      </Button>
                    )
                  ) : (
                    <>
                      <button
                        type="button"
                        className="text-sm text-gray-500 hover:text-gray-700"
                        onClick={() => {
                          setEditingId(tag.id);
                          setEditingName(tag.name);
                        }}
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        className="text-sm text-blue-500 hover:text-blue-700"
                        onClick={() => setMergeSource(tag.id)}
                      >
                        合并
                      </button>
                      <button
                        type="button"
                        className="text-sm text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteTag(tag.id)}
                        disabled={tag.count > 0}
                      >
                        删除
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 合并模式提示 */}
      {mergeSource && (
        <div className="fixed bottom-4 right-4 p-4 bg-blue-100 rounded-lg shadow-lg">
          <p className="text-sm text-blue-800">
            选择要合并到的目标标签
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => setMergeSource(null)}
          >
            取消合并
          </Button>
        </div>
      )}
    </div>
  );
}; 