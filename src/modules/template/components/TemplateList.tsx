import React, { useState, useCallback } from 'react';
import { TemplateListItem, TemplateFilter, TemplateCategory, TemplateTag } from '../types';
import { Input, Select, Button } from '../../common/components';

interface TemplateListProps {
  templates: TemplateListItem[];
  categories: TemplateCategory[];
  tags: TemplateTag[];
  onSelect: (template: TemplateListItem) => void;
  onEdit?: (template: TemplateListItem) => void;
  onDelete?: (template: TemplateListItem) => void;
  onDuplicate?: (template: TemplateListItem) => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  categories,
  tags,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const [filter, setFilter] = useState<TemplateFilter>({
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = useCallback((key: keyof TemplateFilter, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  }, []);

  const filteredTemplates = templates.filter(template => {
    // 搜索过滤
    if (searchTerm && !template.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // 分类过滤
    if (filter.category && template.category !== filter.category) {
      return false;
    }

    // 标签过滤
    if (filter.tags && filter.tags.length > 0) {
      if (!filter.tags.every(tag => template.tags.includes(tag))) {
        return false;
      }
    }

    // 预设过滤
    if (filter.isPreset !== undefined && template.isPreset !== filter.isPreset) {
      return false;
    }

    return true;
  });

  // 排序
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (!filter.sortBy) return 0;

    const order = filter.sortOrder === 'asc' ? 1 : -1;
    const aValue = a[filter.sortBy];
    const bValue = b[filter.sortBy];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * order;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * order;
    }

    return 0;
  });

  return (
    <div className="space-y-4">
      {/* 过滤器 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          placeholder="搜索模板..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
        />
        <Select
          value={filter.category || ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('category', e.target.value)}
        >
          <option value="">所有分类</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select
          value={filter.sortBy || ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('sortBy', e.target.value)}
        >
          <option value="updatedAt">最近更新</option>
          <option value="createdAt">创建时间</option>
          <option value="name">名称</option>
          <option value="usageCount">使用次数</option>
          <option value="lastUsed">最近使用</option>
        </Select>
        <Select
          value={filter.sortOrder || ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('sortOrder', e.target.value)}
        >
          <option value="desc">降序</option>
          <option value="asc">升序</option>
        </Select>
      </div>

      {/* 标签过滤器 */}
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <button
            key={tag.id}
            className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${filter.tags?.includes(tag.id)
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
            onClick={() => {
              const currentTags = filter.tags || [];
              const newTags = currentTags.includes(tag.id)
                ? currentTags.filter(id => id !== tag.id)
                : [...currentTags, tag.id];
              handleFilterChange('tags', newTags);
            }}
          >
            {tag.name}
            <span className="ml-1 text-xs opacity-75">({tag.count})</span>
          </button>
        ))}
      </div>

      {/* 模板列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTemplates.map(template => (
          <div
            key={template.id}
            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {template.description}
                  </p>
                )}
              </div>
              {template.isPreset && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  预设
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {template.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                使用次数：{template.usageCount}
              </div>
              <div className="flex space-x-2">
                {template.isEditable && onEdit && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit(template)}
                  >
                    编辑
                  </Button>
                )}
                {onDuplicate && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onDuplicate(template)}
                  >
                    复制
                  </Button>
                )}
                {template.isEditable && onDelete && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(template)}
                  >
                    删除
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onSelect(template)}
                >
                  使用
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {sortedTemplates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          没有找到匹配的模板
        </div>
      )}
    </div>
  );
}; 