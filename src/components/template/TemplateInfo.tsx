import React from 'react';
import { Tag, Tooltip } from 'antd';
import styled from '@emotion/styled';
import type { Template } from '../../services/TemplateManager';

interface TemplateInfoProps {
  template: Template | null;
}

const InfoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TemplateTag = styled(Tag)`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const UpdateTime = styled.span`
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
`;

export const TemplateInfo: React.FC<TemplateInfoProps> = ({ template }) => {
  if (!template) {
    return null;
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <InfoContainer>
      <Tooltip title={`创建时间: ${formatDate(template.createdAt)}`}>
        <TemplateTag color="blue">
          当前模板: {template.name}
          <UpdateTime>
            更新于 {formatDate(template.updatedAt)}
          </UpdateTime>
        </TemplateTag>
      </Tooltip>
    </InfoContainer>
  );
}; 