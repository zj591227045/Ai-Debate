import React from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { SpeechRecord } from './SpeechRecord';
import type { Speech } from '../../types/adapters';
import type { UnifiedPlayer } from '../../types/adapters';

interface SpeechListProps {
  players: UnifiedPlayer[];
  currentSpeakerId?: string;
  speeches: Speech[];
  onReference?: (speechId: string) => void;
  getReferencedSpeeches?: (speechId: string) => Speech[];
  streamingSpeech?: {
    playerId: string;
    content: string;
  };
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.02);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
  }
`;

const NoSpeeches = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: rgba(0, 0, 0, 0.45);
  font-size: 16px;
`;

const SpeechListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const SpeechList: React.FC<SpeechListProps> = ({
  players,
  currentSpeakerId,
  speeches,
  onReference,
  getReferencedSpeeches,
  streamingSpeech
}) => {
  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.name || '未知选手';
  };

  // 自动滚动到底部
  React.useEffect(() => {
    if (streamingSpeech || speeches.length > 0) {
      const container = document.querySelector('.speech-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [streamingSpeech, speeches]);

  if (speeches.length === 0 && !streamingSpeech) {
    return (
      <Container className="speech-container">
        <NoSpeeches>暂无发言记录</NoSpeeches>
      </Container>
    );
  }

  return (
    <Container className="speech-container">
      <SpeechListContainer>
        <AnimatePresence>
          {speeches.map((speech) => (
            <motion.div
              key={speech.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SpeechRecord
                speech={speech}
                playerName={getPlayerName(speech.playerId)}
                isCurrentSpeaker={speech.playerId === currentSpeakerId}
                onReference={onReference}
                referencedSpeeches={getReferencedSpeeches?.(speech.id)}
              />
            </motion.div>
          ))}
          
          {streamingSpeech && (
            <motion.div
              key="streaming"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SpeechRecord
                speech={{
                  id: 'streaming',
                  playerId: streamingSpeech.playerId,
                  content: streamingSpeech.content,
                  timestamp: new Date().toISOString(),
                  round: speeches.length > 0 ? speeches[speeches.length - 1].round : 1,
                  references: []
                }}
                playerName={getPlayerName(streamingSpeech.playerId)}
                isCurrentSpeaker={true}
                isStreaming={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </SpeechListContainer>
    </Container>
  );
}; 