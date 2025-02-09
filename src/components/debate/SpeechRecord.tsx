import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { formatTimestamp } from '../../utils/timestamp';
import type { Speech } from '../../types/adapters';

interface SpeechRecordProps {
  speech: Speech;
  playerName: string;
  isCurrentSpeaker: boolean;
  onReference?: (speechId: string) => void;
  referencedSpeeches?: Speech[];
  isStreaming?: boolean;
}

const Container = styled(motion.div)<{ $isCurrentSpeaker: boolean }>`
  max-width: 80%;
  padding: 16px;
  background: ${props => props.$isCurrentSpeaker ? 'rgba(24, 144, 255, 0.1)' : '#fff'};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: ${props => props.$isCurrentSpeaker ? '0 0 0 auto' : '0'};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PlayerName = styled.span`
  font-weight: 500;
  color: #1f1f1f;
`;

const Timestamp = styled.span`
  font-size: 12px;
  color: #8c8c8c;
`;

const Content = styled.div<{ $isStreaming?: boolean }>`
  white-space: pre-wrap;
  line-height: 1.6;
  color: #1f1f1f;
  ${props => props.$isStreaming && `
    &::after {
      content: '|';
      animation: blink 1s infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `}
`;

const References = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
`;

const ReferenceItem = styled.div`
  font-size: 13px;
  color: #666;
  padding: 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  
  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
`;

export const SpeechRecord: React.FC<SpeechRecordProps> = ({
  speech,
  playerName,
  isCurrentSpeaker,
  onReference,
  referencedSpeeches,
  isStreaming
}) => {
  return (
    <Container 
      $isCurrentSpeaker={isCurrentSpeaker}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <PlayerInfo>
          <PlayerName>{playerName}</PlayerName>
          {isStreaming && (
            <span style={{ 
              fontSize: '12px',
              padding: '2px 8px',
              background: '#1890ff',
              color: '#fff',
              borderRadius: '10px'
            }}>
              正在发言...
            </span>
          )}
        </PlayerInfo>
        <Timestamp>{formatTimestamp(speech.timestamp)}</Timestamp>
      </Header>
      
      <Content $isStreaming={isStreaming}>
        {speech.content}
      </Content>

      {referencedSpeeches && referencedSpeeches.length > 0 && (
        <References>
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>
            引用发言:
          </div>
          {referencedSpeeches.map(ref => (
            <ReferenceItem 
              key={ref.id}
              onClick={() => onReference?.(ref.id)}
            >
              {ref.content}
            </ReferenceItem>
          ))}
        </References>
      )}
    </Container>
  );
}; 