import React from 'react';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  error,
  checked,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1">
      <label className="inline-flex items-center">
        <span className="relative">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={checked}
            {...props}
          />
          <div
            className={`
              w-11 h-6 bg-gray-200 rounded-full peer
              peer-focus:ring-4 peer-focus:ring-primary-light
              peer-checked:after:translate-x-full peer-checked:after:border-white
              after:content-[''] after:absolute after:top-0.5 after:left-[2px]
              after:bg-white after:border-gray-300 after:border after:rounded-full
              after:h-5 after:w-5 after:transition-all
              peer-checked:bg-primary
              ${className}
            `}
          />
        </span>
        {label && (
          <span className="ml-3 text-sm font-medium text-gray-700">
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