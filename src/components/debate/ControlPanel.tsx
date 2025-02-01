import React from 'react';
import styled from '@emotion/styled';

export interface ControlPanelProps {
  isDebating: boolean;
  isPaused?: boolean;
  onStart: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onEnd: () => void;
  onNextSpeaker?: () => void;
  canNextSpeaker?: boolean;
}

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.default};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background-color: ${props => {
    switch (props.variant) {
      case 'danger':
        return props.theme.colors.error;
      case 'secondary':
        return props.theme.colors.background.secondary;
      default:
        return props.theme.colors.primary;
    }
  }};
  color: ${props => props.variant === 'secondary' ? props.theme.colors.text.primary : 'white'};
  border: none;
  border-radius: ${props => props.theme.radius.md};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.md};
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    background-color: ${props => props.theme.colors.text.tertiary};
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isDebating,
  isPaused: externalIsPaused,
  onStart,
  onPause,
  onResume,
  onEnd,
  onNextSpeaker,
  canNextSpeaker
}) => {
  const [internalIsPaused, setInternalIsPaused] = React.useState(false);
  const isPaused = externalIsPaused ?? internalIsPaused;

  const handlePauseResume = () => {
    if (isPaused) {
      onResume?.();
      setInternalIsPaused(false);
    } else {
      onPause?.();
      setInternalIsPaused(true);
    }
  };

  return (
    <Container>
      {!isDebating ? (
        <Button onClick={onStart} variant="primary">
          开始辩论
        </Button>
      ) : (
        <>
          {(onPause || onResume) && (
            <Button onClick={handlePauseResume} variant="secondary">
              {isPaused ? '继续' : '暂停'}
            </Button>
          )}
          {onNextSpeaker && (
            <Button 
              onClick={onNextSpeaker} 
              variant="primary"
              disabled={!canNextSpeaker}
            >
              下一位发言
            </Button>
          )}
          <Button onClick={onEnd} variant="danger">
            结束辩论
          </Button>
        </>
      )}
    </Container>
  );
};

export default ControlPanel; 