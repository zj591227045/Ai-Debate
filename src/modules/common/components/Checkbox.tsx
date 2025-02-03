import React from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  indeterminate?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  indeterminate,
  className = '',
  ...props
}) => {
  const checkboxRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate || false;
    }
  }, [indeterminate]);

  return (
    <div className="space-y-1">
      <label className="inline-flex items-center">
        <input
          ref={checkboxRef}
          type="checkbox"
          className={`
            rounded border-gray-300 text-primary
            focus:ring-primary focus:ring-offset-0
            ${error ? 'border-red-300' : ''}
            ${className}
          `}
          {...props}
        />
        {label && (
          <span className="ml-2 text-sm text-gray-700">
            {label}
          </span>
        )}
      </label>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}; 