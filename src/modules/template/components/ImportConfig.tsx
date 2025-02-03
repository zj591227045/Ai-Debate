import React, { useState, useCallback } from 'react';
import { Template, TemplateCategory } from '../types';
import { Button, Checkbox, Input } from '../../common/components';
import { useToast } from '../../common/hooks/useToast';

interface ImportConfigProps {
  onImport: (config: ImportConfig) => Promise<void>;
  onCancel: () => void;
}

interface ImportConfig {
  file: File;
  options: {
    overwriteExisting: boolean;
    importCategories: boolean;
    importTags: boolean;
    keepStats: boolean;
  };
}

interface ImportPreview {
  templates: {
    total: number;
    new: number;
    existing: number;
  };
  categories: {
    total: number;
    new: number;
  };
  tags: {
    total: number;
    new: number;
  };
}

export const ImportConfig: React.FC<ImportConfigProps> = ({
  onImport,
  onCancel,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [options, setOptions] = useState({
    overwriteExisting: false,
    importCategories: true,
    importTags: true,
    keepStats: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const { showToast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      setIsValidating(true);
      setFile(selectedFile);

      // 读取文件内容并验证
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);

          // 这里应该进行更详细的数据验证
          // 暂时只做简单的结构验证
          if (!data.templates || !Array.isArray(data.templates)) {
            throw new Error('无效的模板数据格式');
          }

          // 设置预览信息
          setPreview({
            templates: {
              total: data.templates.length,
              new: data.templates.length, // 这里需要与后端进行对比
              existing: 0, // 这里需要与后端进行对比
            },
            categories: {
              total: data.categories?.length || 0,
              new: data.categories?.length || 0, // 这里需要与后端进行对比
            },
            tags: {
              total: new Set(data.templates.flatMap((t: any) => t.tags)).size,
              new: 0, // 这里需要与后端进行对比
            },
          });
        } catch (error) {
          if (error instanceof Error) {
            showToast(error.message, 'error');
          }
          setFile(null);
          setPreview(null);
        }
      };
      reader.readAsText(selectedFile);
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, 'error');
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setIsSubmitting(true);
      await onImport({
        file,
        options,
      });
      showToast('导入成功', 'success');
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
        <h3 className="text-lg font-medium">导入配置</h3>
        <p className="mt-1 text-sm text-gray-500">
          选择要导入的模板文件和导入选项
        </p>
      </div>

      {/* 文件选择 */}
      <div>
        <Input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          disabled={isSubmitting}
        />
        {isValidating && (
          <p className="mt-2 text-sm text-gray-500">
            正在验证文件...
          </p>
        )}
      </div>

      {/* 导入选项 */}
      {file && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={options.overwriteExisting}
              onChange={e => setOptions(prev => ({ ...prev, overwriteExisting: e.target.checked }))}
            />
            <label className="text-sm">覆盖已存在的模板</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={options.importCategories}
              onChange={e => setOptions(prev => ({ ...prev, importCategories: e.target.checked }))}
            />
            <label className="text-sm">导入分类信息</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={options.importTags}
              onChange={e => setOptions(prev => ({ ...prev, importTags: e.target.checked }))}
            />
            <label className="text-sm">导入标签信息</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={options.keepStats}
              onChange={e => setOptions(prev => ({ ...prev, keepStats: e.target.checked }))}
            />
            <label className="text-sm">保留使用统计</label>
          </div>
        </div>
      )}

      {/* 导入预览 */}
      {preview && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
          <h4 className="font-medium">导入预览</h4>
          <div className="space-y-1 text-sm">
            <p>
              模板：共 {preview.templates.total} 个
              （新增 {preview.templates.new} 个，
              已存在 {preview.templates.existing} 个）
            </p>
            {preview.categories.total > 0 && (
              <p>
                分类：共 {preview.categories.total} 个
                （新增 {preview.categories.new} 个）
              </p>
            )}
            {preview.tags.total > 0 && (
              <p>
                标签：共 {preview.tags.total} 个
                （新增 {preview.tags.new} 个）
              </p>
            )}
          </div>
        </div>
      )}

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
          onClick={handleImport}
          disabled={!file || isSubmitting || isValidating}
          loading={isSubmitting}
        >
          导入
        </Button>
      </div>
    </div>
  );
}; 