import React from 'react';

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationErrorsProps {
  errors: ValidationError[];
  className?: string;
}

export const ValidationErrors: React.FC<ValidationErrorsProps> = ({
  errors,
  className = '',
}) => {
  if (errors.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-red-800">
        请修正以下错误：
      </h4>
      <ul className="list-disc list-inside space-y-1">
        {errors.map((error, index) => (
          <li key={index} className="text-sm text-red-600">
            <span className="font-medium">{error.field}：</span>
            {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}; 