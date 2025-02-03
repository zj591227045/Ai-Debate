import React, { useState, useCallback } from 'react';
import { TemplateCategory } from '../types';
import { Button, Input, TextArea } from '../../common/components';
import { useToast } from '../../common/hooks/useToast';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';

interface CategoryManagerProps {
  categories: TemplateCategory[];
  onAdd: (category: Omit<TemplateCategory, 'id' | 'count'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Omit<TemplateCategory, 'id' | 'count'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (sourceIndex: number, destinationIndex: number) => Promise<void>;
}

interface CategoryFormData {
  name: string;
  description?: string;
}

const initialFormData: CategoryFormData = {
  name: '',
  description: '',
};

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
}) => {
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingId) {
        await onUpdate(editingId, formData);
        showToast('分类更新成功', 'success');
      } else {
        await onAdd({
          name: formData.name,
          description: formData.description,
          order: categories.length,
        });
        showToast('分类添加成功', 'success');
      }
      setFormData(initialFormData);
      setEditingId(null);
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: TemplateCategory) => {
    setFormData({
      name: category.name,
      description: category.description,
    });
    setEditingId(category.id);
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      showToast('分类删除成功', 'success');
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error');
      }
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    try {
      await onReorder(sourceIndex, destinationIndex);
      showToast('分类排序更新成功', 'success');
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 添加/编辑表单 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="分类名称"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
        <TextArea
          label="分类描述"
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
        <div className="flex justify-end space-x-2">
          {editingId && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFormData(initialFormData);
                setEditingId(null);
              }}
              disabled={isSubmitting}
            >
              取消
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={!formData.name.trim() || isSubmitting}
            loading={isSubmitting}
          >
            {editingId ? '更新' : '添加'}
          </Button>
        </div>
      </form>

      {/* 分类列表 */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="categories">
          {(provided: DroppableProvided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {categories.map((category, index) => (
                <Draggable
                  key={category.id}
                  draggableId={category.id}
                  index={index}
                >
                  {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`
                        p-4 rounded-lg border
                        ${snapshot.isDragging ? 'bg-gray-50' : 'bg-white'}
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-medium">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {category.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            模板数量：{category.count}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            className="text-sm text-gray-500 hover:text-gray-700"
                            onClick={() => handleEdit(category)}
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            className="text-sm text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(category.id)}
                            disabled={category.count > 0}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}; 