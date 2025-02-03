import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Select, Button, Space } from 'antd';

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledSelect = styled(Select)`
  width: 200px;
`;

const StyledButton = styled(Button)`
  height: 32px;
  &.ant-btn-primary {
    background-color: #4157ff;
  }
`;

interface TemplateActionsProps {
  onLoadTemplate: (templateId: string) => void;
  onSaveTemplate: () => void;
}

export const TemplateActions: React.FC<TemplateActionsProps> = ({
  onLoadTemplate,
  onSaveTemplate,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const handleTemplateChange = (value: unknown) => {
    const templateId = value as string;
    setSelectedTemplate(templateId);
    onLoadTemplate(templateId);
  };

  return (
    <Container>
      <StyledSelect
        placeholder="选择模板"
        value={selectedTemplate}
        onChange={handleTemplateChange}
      >
        <Select.Option value="template1">模板1</Select.Option>
        <Select.Option value="template2">模板2</Select.Option>
      </StyledSelect>
      <Space>
        <StyledButton>加载模板</StyledButton>
        <StyledButton type="primary">保存为模板</StyledButton>
      </Space>
    </Container>
  );
};

export default TemplateActions; 