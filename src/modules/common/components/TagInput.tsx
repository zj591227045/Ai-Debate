import React, { useState } from 'react';

interface TagInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  error?: string;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  label,
  tags,
  onChange,
  error,
  placeholder = '输入标签，按回车添加',
  maxTags = 10,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = inputValue.trim();
      if (value && !tags.includes(value) && tags.length < maxTags) {
        onChange([...tags, value]);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <div
          className={`
            min-h-[38px] w-full rounded-md border border-gray-300
            focus-within:border-primary focus-within:ring-1 focus-within:ring-primary
            ${error ? 'border-red-300' : ''}
          `}
        >
          <div className="flex flex-wrap gap-1 p-1">
            {tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs"
              >
                {tag}
                <button
                  type="button"
                  className="ml-1 text-gray-400 hover:text-gray-600"
                  onClick={() => removeTag(tag)}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              className="flex-1 border-0 bg-transparent p-1 text-sm focus:outline-none focus:ring-0"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tags.length < maxTags ? placeholder : '已达到标签数量上限'}
              disabled={tags.length >= maxTags}
            />
          </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {tags.length}/{maxTags} 个标签
        </p>
      </div>
    </div>
  );
}; 