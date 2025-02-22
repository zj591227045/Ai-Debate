import React, { useMemo, useEffect, useRef } from 'react';
import styled from '@emotion/styled';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
  highlightPattern?: RegExp;
}

const StyledTextArea = styled.textarea<{ hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme, hasError }) => hasError ? theme.colors.error : theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  background: transparent !important;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  line-height: 1.5;
  resize: vertical;
  transition: all ${({ theme }) => theme.transitions.normal};
  position: relative;
  z-index: 1;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}33;
    background: transparent !important;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.tertiary};
  }
`;

const TextAreaContainer = styled.div`
  position: relative;
  width: 100%;
  background: ${({ theme }) => theme.colors.background.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
`;

const HighlightOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  padding: 0.75rem;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  overflow: hidden;
  z-index: 2;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  line-height: 1.5;
  color: transparent;
  font-family: inherit;

  mark {
    background-color: rgba(255, 255, 0, 0.3);
    border-radius: 2px;
    color: transparent;
    padding: 0 2px;
  }
`;

const TextAreaWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ErrorText = styled.p`
  margin-top: 0.5rem;
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  className = '',
  required,
  highlightPattern = /\{\{([^}]+)\}\}/g,
  value = '',
  ...props
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // 同步滚动位置
  const handleScroll = () => {
    if (textAreaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textAreaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textAreaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    const textArea = textAreaRef.current;
    if (textArea) {
      textArea.addEventListener('scroll', handleScroll);
      return () => {
        textArea.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  const highlightedText = useMemo(() => {
    if (typeof value !== 'string') {
      return '';
    }
    
    const result = String(value).replace(
      highlightPattern,
      (match, content) => `<mark>${match}</mark>`
    );
    return result;
  }, [value, highlightPattern]);

  return (
    <TextAreaWrapper className="space-y-1">
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <TextAreaContainer>
        <StyledTextArea
          ref={textAreaRef}
          value={value}
          className={`${className} ant-input`}
          hasError={!!error}
          style={{ backgroundColor: 'transparent' }}
          {...props}
        />
        <HighlightOverlay
          ref={overlayRef}
          dangerouslySetInnerHTML={{ __html: highlightedText }}
        />
      </TextAreaContainer>
      {error && <ErrorText>{error}</ErrorText>}
    </TextAreaWrapper>
  );
}; 