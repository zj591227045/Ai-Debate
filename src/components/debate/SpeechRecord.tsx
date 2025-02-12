import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { formatTimestamp } from '../../utils/timestamp';
import type { Speech, BaseDebateSpeech } from '../../types/adapters';

interface SpeechRecordProps {
  speaker: string;
  content: string;
  timestamp: string;
  isCurrentSpeaker: boolean;
  onReference?: () => void;
  referencedSpeeches?: BaseDebateSpeech[];
  streaming?: boolean;
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
    &:after {
      content: '▋';
      display: inline-block;
      animation: blink 1s infinite;
      margin-left: 2px;
      color: #1890ff;
    }
    
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `}
`;

export const SpeechRecord: React.FC<SpeechRecordProps> = ({
  speaker,
  content,
  timestamp,
  isCurrentSpeaker,
  onReference,
  referencedSpeeches,
  streaming
}) => {
  return (
    <Container $isCurrentSpeaker={isCurrentSpeaker}>
      <Header>
        <PlayerInfo>
          <PlayerName>{speaker}</PlayerName>
          {streaming && (
            <span style={{ 
              fontSize: '12px',
              padding: '2px 8px',
              background: 'rgba(24, 144, 255, 0.1)',
              color: '#1890ff',
              borderRadius: '4px'
            }}>
              正在输入...
            </span>
          )}
        </PlayerInfo>
        <Timestamp>{formatTimestamp(timestamp)}</Timestamp>
      </Header>
      <Content $isStreaming={streaming}>
        {content}
      </Content>
      {referencedSpeeches && referencedSpeeches.length > 0 && (
        <div style={{ 
          marginTop: '8px',
          padding: '8px',
          background: 'rgba(0, 0, 0, 0.02)',
          borderRadius: '4px',
          fontSize: '13px'
        }}>
          <div style={{ color: '#8c8c8c', marginBottom: '4px' }}>引用内容：</div>
          {referencedSpeeches.map((speech, index) => (
            <div key={speech.id} style={{ 
              padding: '4px 8px',
              color: '#666',
              borderLeft: '2px solid rgba(24, 144, 255, 0.3)'
            }}>
              {speech.content}
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}; 