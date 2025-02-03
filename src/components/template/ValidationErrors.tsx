import React from 'react';
import { Alert, List } from 'antd';
import type { ValidationResult } from '../../services/TemplateValidator';

interface ValidationErrorsProps {
  result: ValidationResult;
}

export const ValidationErrors: React.FC<ValidationErrorsProps> = ({ result }) => {
  if (result.isValid) {
    return null;
  }

  return (
    <Alert
      type="error"
      message="配置验证失败"
      description={
        <List
          size="small"
          dataSource={result.errors}
          renderItem={(error) => (
            <List.Item>
              <span style={{ color: '#ff4d4f' }}>
                {error.field}: {error.message}
              </span>
            </List.Item>
          )}
        />
      }
    />
  );
}; 