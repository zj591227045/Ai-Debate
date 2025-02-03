import React from 'react';
import { Template } from '../types';
import { TypeMatchIndicator } from '../../common/components/TypeMatchIndicator';

interface TemplatePreviewCardProps {
  template: Template;
  className?: string;
}

export const TemplatePreviewCard: React.FC<TemplatePreviewCardProps> = ({
  template,
  className = '',
}) => {
  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      {/* 头部信息 */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">{template.name}</h3>
          {template.description && (
            <p className="text-sm text-gray-500 mt-1">
              {template.description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {template.isPreset && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              预设
            </span>
          )}
          <TypeMatchIndicator
            topicType={template.content.topic.type}
            ruleFormat={template.content.rules.format}
          />
        </div>
      </div>

      {/* 主题信息 */}
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium">辩题</h4>
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-sm">{template.content.topic.title}</p>
          {template.content.topic.background && (
            <p className="text-xs text-gray-500 mt-2">
              {template.content.topic.background}
            </p>
          )}
        </div>
      </div>

      {/* 规则概览 */}
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium">规则概览</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">基础规则</p>
            <ul className="text-xs space-y-1">
              <li>
                字数限制：{template.content.rules.speechRules.minLength} - {template.content.rules.speechRules.maxLength}
              </li>
              <li>
                时间限制：{template.content.rules.speechRules.timeLimit || '无限制'}
              </li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">高级规则</p>
            <ul className="text-xs space-y-1">
              <li>
                允许引用：{template.content.rules.advancedRules.allowQuoting ? '是' : '否'}
              </li>
              <li>
                要求回应：{template.content.rules.advancedRules.requireResponse ? '是' : '否'}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 标签 */}
      <div className="mt-4 flex flex-wrap gap-1">
        {template.tags.map(tag => (
          <span
            key={tag}
            className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* 使用统计 */}
      <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
        <span>使用次数：{template.usageCount}</span>
        <span>
          最后使用：
          {template.lastUsed
            ? new Date(template.lastUsed).toLocaleDateString()
            : '从未使用'}
        </span>
      </div>
    </div>
  );
}; 