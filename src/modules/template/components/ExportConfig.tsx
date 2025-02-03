import React, { useState } from 'react';
import { Template, TemplateCategory } from '../types';
import { Button, Checkbox } from '../../common/components';
import { useToast } from '../../common/hooks/useToast';

interface ExportConfigProps {
  templates: Template[];
  categories: TemplateCategory[];
  onExport: (config: ExportConfig) => Promise<void>;
  onCancel: () => void;
}

interface ExportConfig {
  templates: string[];
  includeCategories: boolean;
  includeTags: boolean;
  includeStats: boolean;
}

export const ExportConfig: React.FC<ExportConfigProps> = ({
  templates,
  categories,
  onExport,
  onCancel,
}) => {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [config, setConfig] = useState<Omit<ExportConfig, 'templates'>>({
    includeCategories: true,
    includeTags: true,
    includeStats: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();

  const handleSelectAll = () => {
    if (selectedTemplates.length === templates.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(templates.map(t => t.id));
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    const categoryTemplates = templates.filter(t => t.category === categoryId);
    const categoryTemplateIds = categoryTemplates.map(t => t.id);
    
    const allSelected = categoryTemplateIds.every(id => selectedTemplates.includes(id));
    if (allSelected) {
      setSelectedTemplates(prev => prev.filter(id => !categoryTemplateIds.includes(id)));
    } else {
      setSelectedTemplates(prev => [...new Set([...prev, ...categoryTemplateIds])]);
    }
  };

  const handleExport = async () => {
    if (selectedTemplates.length === 0) {
      showToast('请至少选择一个模板', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await onExport({
        templates: selectedTemplates,
        ...config,
      });
      showToast('导出成功', 'success');
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">导出配置</h3>
        <p className="mt-1 text-sm text-gray-500">
          选择要导出的模板和相关配置
        </p>
      </div>

      {/* 导出选项 */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={config.includeCategories}
            onChange={e => setConfig(prev => ({ ...prev, includeCategories: e.target.checked }))}
          />
          <label className="text-sm">包含分类信息</label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={config.includeTags}
            onChange={e => setConfig(prev => ({ ...prev, includeTags: e.target.checked }))}
          />
          <label className="text-sm">包含标签信息</label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={config.includeStats}
            onChange={e => setConfig(prev => ({ ...prev, includeStats: e.target.checked }))}
          />
          <label className="text-sm">包含使用统计</label>
        </div>
      </div>

      {/* 模板选择 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium">选择模板</h4>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedTemplates.length === templates.length ? '取消全选' : '全选'}
          </Button>
        </div>

        {/* 按分类分组显示 */}
        <div className="space-y-4">
          {categories.map(category => {
            const categoryTemplates = templates.filter(t => t.category === category.id);
            if (categoryTemplates.length === 0) return null;

            const allSelected = categoryTemplates.every(t => selectedTemplates.includes(t.id));
            const someSelected = categoryTemplates.some(t => selectedTemplates.includes(t.id));

            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={!allSelected && someSelected}
                    onChange={() => handleSelectCategory(category.id)}
                  />
                  <span className="font-medium">{category.name}</span>
                  <span className="text-sm text-gray-500">
                    ({categoryTemplates.length})
                  </span>
                </div>
                <div className="ml-6 space-y-2">
                  {categoryTemplates.map(template => (
                    <div key={template.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedTemplates.includes(template.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedTemplates(prev => [...prev, template.id]);
                          } else {
                            setSelectedTemplates(prev => prev.filter(id => id !== template.id));
                          }
                        }}
                      />
                      <span className="text-sm">{template.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 按钮组 */}
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          取消
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleExport}
          disabled={selectedTemplates.length === 0 || isSubmitting}
          loading={isSubmitting}
        >
          导出
        </Button>
      </div>

      {/* 选择统计 */}
      <div className="text-sm text-gray-500">
        已选择 {selectedTemplates.length} 个模板
      </div>
    </div>
  );
}; 