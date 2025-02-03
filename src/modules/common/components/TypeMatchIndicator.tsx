import React from 'react';
import { TopicType } from '../../topic/types';
import { DebateFormat } from '../../rules/types';

interface TypeMatchIndicatorProps {
  topicType: TopicType;
  ruleFormat: DebateFormat;
  className?: string;
}

export const TypeMatchIndicator: React.FC<TypeMatchIndicatorProps> = ({
  topicType,
  ruleFormat,
  className = '',
}) => {
  const getTypeColor = () => {
    switch (topicType) {
      case 'policy':
        return 'bg-green-100 text-green-800';
      case 'value':
        return 'bg-purple-100 text-purple-800';
      case 'fact':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormatColor = () => {
    switch (ruleFormat) {
      case 'structured':
        return 'bg-blue-100 text-blue-800';
      case 'free':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = () => {
    switch (topicType) {
      case 'policy':
        return '政策类';
      case 'value':
        return '价值类';
      case 'fact':
        return '事实类';
      default:
        return '未知类型';
    }
  };

  const getFormatLabel = () => {
    switch (ruleFormat) {
      case 'structured':
        return '结构化';
      case 'free':
        return '自由式';
      default:
        return '未知格式';
    }
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor()}`}>
        {getTypeLabel()}
      </span>
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getFormatColor()}`}>
        {getFormatLabel()}
      </span>
    </div>
  );
}; 