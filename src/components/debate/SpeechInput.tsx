import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import type { Speech } from '../../hooks/debate/useSpeechRecorder';

interface SpeechInputProps {
  playerId: string;
  onSubmit: (content: string, type: Speech['type'], references?: string[]) => Promise<boolean>;
  disabled?: boolean;
  maxLength?: number;
  minLength?: number;
  referencedSpeeches?: Speech[];
  onClearReferences?: () => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.background.primary};
  border-top: 1px solid ${props => props.theme.colors.border};
  width: 100%;
`;

const InputArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  background-color: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.text.primary};
  font-family: inherit;
  font-size: ${props => props.theme.typography.fontSize.md};
  resize: vertical;
  transition: border-color ${props => props.theme.transitions.fast};
  margin: 0;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }

  &:disabled {
    background-color: ${props => props.theme.colors.background.default};
    cursor: not-allowed;
  }
`;

const Controls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background-color: ${props => 
    props.variant === 'secondary' ? 
    props.theme.colors.background.secondary : 
    props.theme.colors.primary};
  color: ${props => 
    props.variant === 'secondary' ? 
    props.theme.colors.text.primary : 
    'white'};
  border: 1px solid ${props => 
    props.variant === 'secondary' ? 
    props.theme.colors.border : 
    'transparent'};
  border-radius: ${props => props.theme.radius.md};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.md};
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background-color: ${props => 
      props.variant === 'secondary' ? 
      props.theme.colors.background.accent : 
      props.theme.colors.primaryDark};
  }

  &:disabled {
    background-color: ${props => props.theme.colors.text.tertiary};
    cursor: not-allowed;
  }
`;

const CharCount = styled.div<{ isOverLimit: boolean }>`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => 
    props.isOverLimit ? 
    props.theme.colors.error : 
    props.theme.colors.text.secondary};
`;

const References = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.radius.md};
`;

const Reference = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => `${props.theme.spacing.xs} ${props.theme.spacing.sm}`};
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.radius.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

const ClearButton = styled.button`
  padding: 0;
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.tertiary};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.sm};

  &:hover {
    color: ${props => props.theme.colors.error};
  }
`;

export const SpeechInput: React.FC<SpeechInputProps> = ({
  playerId,
  onSubmit,
  disabled,
  maxLength = 1000,
  minLength = 10,
  referencedSpeeches,
  onClearReferences
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleSubmit = useCallback(async () => {
    if (disabled || isSubmitting) return;
    if (content.length < minLength || content.length > maxLength) return;

    setIsSubmitting(true);
    try {
      const references = referencedSpeeches?.map(s => s.id);
      const success = await onSubmit(content, 'speech', references);
      if (success) {
        setContent('');
        onClearReferences?.();
        setIsVisible(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    content,
    disabled,
    isSubmitting,
    maxLength,
    minLength,
    onSubmit,
    referencedSpeeches,
    onClearReferences
  ]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSubmit();
    }
  };

  const isOverLimit = content.length > maxLength;
  const isBelowLimit = content.length < minLength;
  const canSubmit = !disabled && !isSubmitting && !isOverLimit && !isBelowLimit;

  if (!isVisible) return null;

  return (
    <Container>
      {referencedSpeeches && referencedSpeeches.length > 0 && (
        <References>
          引用：
          {referencedSpeeches.map((speech) => (
            <Reference key={speech.id}>
              {speech.content.slice(0, 20)}...
            </Reference>
          ))}
          <ClearButton onClick={onClearReferences}>
            清除引用
          </ClearButton>
        </References>
      )}

      <InputArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled || isSubmitting}
        placeholder="输入发言内容..."
      />

      <Controls>
        <CharCount isOverLimit={isOverLimit}>
          {content.length} / {maxLength}
        </CharCount>

        <ButtonGroup>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            发送发言
          </Button>
        </ButtonGroup>
      </Controls>
    </Container>
  );
};

export default SpeechInput; 