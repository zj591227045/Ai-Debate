import React from 'react';

interface NumberInputProps {
  label?: string;
  value: number | undefined;
  onChange: (value: number) => void;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  required?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  error,
  min,
  max,
  step = 1,
  className = '',
  required,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value === '' ? min || 0 : Number(e.target.value);
    if (
      !isNaN(newValue) &&
      (min === undefined || newValue >= min) &&
      (max === undefined || newValue <= max)
    ) {
      onChange(newValue);
    }
  };

  const handleIncrement = () => {
    const currentValue = value ?? (min || 0);
    const newValue = currentValue + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const currentValue = value ?? (min || 0);
    const newValue = currentValue - step;
    if (min === undefined || newValue >= min) {
      onChange(newValue);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative flex rounded-md shadow-sm">
        <button
          type="button"
          className="relative -ml-px inline-flex items-center space-x-2 rounded-l-md border border-gray-300 bg-gray-50 px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          onClick={handleDecrement}
          disabled={min !== undefined && (value ?? 0) <= min}
        >
          -
        </button>
        <input
          type="number"
          className={`
            block w-full min-w-0 flex-1 border-gray-300 px-3 py-2
            focus:border-primary focus:ring-primary sm:text-sm
            ${error ? 'border-red-300' : ''}
          `}
          value={value ?? ''}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          required={required}
        />
        <button
          type="button"
          className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          onClick={handleIncrement}
          disabled={max !== undefined && (value ?? 0) >= max}
        >
          +
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}; 