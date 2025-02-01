import React, { useState } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import type { Speech } from '../../hooks/debate/useSpeechRecorder';

interface SpeechRecordProps {
  speech: Speech;
  playerName: string;
  onReference?: (speechId: string) => void;
  referencedSpeeches?: Speech[];
  isCurrentSpeaker?: boolean;
}

const Container = styled(motion.div)<{ isCurrentSpeaker?: boolean; isInnerThought?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => 
    props.isInnerThought ? 
    `${props.theme.colors.secondary}15` :
    props.isCurrentSpeaker ? 
    props.theme.colors.background.accent : 
    props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.radius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  max-width: 80%;
  margin: ${props => props.theme.spacing.sm} 0;
  border-left: 4px solid ${props => 
    props.isInnerThought ? 
    props.theme.colors.secondary : 
    props.theme.colors.primary};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const PlayerName = styled.div`
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
`;

const SpeechType = styled.span<{ isInnerThought?: boolean }>`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => 
    props.isInnerThought ? 
    props.theme.colors.secondary : 
    props.theme.colors.primary};
  margin-left: ${props => props.theme.spacing.sm};
  padding: ${props => `${props.theme.spacing.xs} ${props.theme.spacing.sm}`};
  background-color: ${props => 
    props.isInnerThought ? 
    `${props.theme.colors.secondary}15` : 
    `${props.theme.colors.primary}15`};
  border-radius: ${props => props.theme.radius.sm};
`;

const Timestamp = styled.div`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.tertiary};
`;

const Content = styled.div<{ isInnerThought?: boolean }>`
  color: ${props => props.theme.colors.text.primary};
  white-space: pre-wrap;
  word-break: break-word;
  font-style: ${props => props.isInnerThought ? 'italic' : 'normal'};
  
  &::before {
    content: ${props => props.isInnerThought ? '"💭"' : '""'};
    margin-right: ${props => props.theme.spacing.sm};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
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
  border-radius: ${props => props.theme.radius.sm};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.sm};
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    background-color: ${props => props.theme.colors.text.tertiary};
    cursor: not-allowed;
  }
`;

const References = styled.div`
  margin-top: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => `${props.theme.colors.background.secondary}80`};
  border-radius: ${props => props.theme.radius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const ReferenceItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const ReferenceHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ReferencePreview = styled(motion.div)`
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.radius.md};
  border: 1px solid ${props => props.theme.colors.border};
  margin-top: ${props => props.theme.spacing.sm};
  overflow: hidden;
`;

export const SpeechRecord: React.FC<SpeechRecordProps> = ({
  speech,
  playerName,
  onReference,
  referencedSpeeches,
  isCurrentSpeaker
}) => {
  const [expandedReferenceId, setExpandedReferenceId] = useState<string | null>(null);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const isInnerThought = speech.type === 'innerThought';

  return (
    <LazyMotion features={domAnimation}>
      <Container
        isCurrentSpeaker={isCurrentSpeaker}
        isInnerThought={isInnerThought}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Header>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <PlayerName>{playerName}</PlayerName>
            <SpeechType isInnerThought={isInnerThought}>
              {isInnerThought ? '内心OS' : '发言'}
            </SpeechType>
          </div>
          <Timestamp>{formatTime(speech.timestamp)}</Timestamp>
        </Header>

        <Content isInnerThought={isInnerThought}>{speech.content}</Content>

        <ButtonGroup>
          {onReference && (
            <Button onClick={() => onReference(speech.id)}>
              引用
            </Button>
          )}
        </ButtonGroup>

        {referencedSpeeches && referencedSpeeches.length > 0 && (
          <References>
            引用：
            {referencedSpeeches.map((ref) => (
              <ReferenceItem key={ref.id}>
                <ReferenceHeader>
                  <div>
                    {ref.content.slice(0, 50)}
                    {ref.content.length > 50 && '...'}
                  </div>
                  <Button 
                    variant="secondary"
                    onClick={() => setExpandedReferenceId(expandedReferenceId === ref.id ? null : ref.id)}
                  >
                    {expandedReferenceId === ref.id ? '收起' : '查看全文'}
                  </Button>
                </ReferenceHeader>
                <motion.div
                  animate={{
                    height: expandedReferenceId === ref.id ? 'auto' : 0,
                    opacity: expandedReferenceId === ref.id ? 1 : 0,
                  }}
                  initial={false}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <ReferencePreview>
                    {ref.content}
                  </ReferencePreview>
                </motion.div>
              </ReferenceItem>
            ))}
          </References>
        )}
      </Container>
    </LazyMotion>
  );
};

export default SpeechRecord; 