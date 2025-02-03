import React from 'react';
import { DebateType } from '../types';

interface DebateTypeSelectorProps {
  value: DebateType;
  onChange: (value: DebateType) => void;
  error?: string;
  disabled?: boolean;
}

interface TypeOption {
  value: DebateType;
  label: string;
  description: string;
  icon: string;
}

const typeOptions: TypeOption[] = [
  {
    value: 'binary',
    label: '二元对立',
    description: '正反双方就一个观点进行辩论',
    icon: '⚔️',
  },
  {
    value: 'multi',
    label: '多方观点',
    description: '多个参与者从不同角度进行讨论',
    icon: '🔄',
  },
];

export const DebateTypeSelector: React.FC<DebateTypeSelectorProps> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        辩论类型
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {typeOptions.map(option => (
          <button
            key={option.value}
            type="button"
            className={`
              relative p-4 rounded-lg border-2 transition-all
              ${value === option.value
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{option.icon}</span>
              <div className="flex-1">
                <h3 className="text-sm font-medium">{option.label}</h3>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
              {value === option.value && (
                <div className="absolute top-2 right-2">
                  <span className="text-primary">✓</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}; 