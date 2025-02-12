import React from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { SpeechRecord } from './SpeechRecord';
import type { BaseDebateSpeech, UnifiedPlayer } from '../../types/adapters';

interface SpeechListProps {
  players: UnifiedPlayer[];
  currentSpeakerId?: string;
  speeches: BaseDebateSpeech[];
  onReference?: (speechId: string) => void;
  getReferencedSpeeches?: (speechId: string) => BaseDebateSpeech[];
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
    return player?.name || playerId;
  };

  return (
    <Container>
      <AnimatePresence>
        {speeches.length === 0 && !streamingSpeech ? (
          <NoSpeeches>暂无发言记录</NoSpeeches>
        ) : (
          <>
            {speeches.map((speech, index) => (
              <motion.div
                key={speech.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SpeechRecord
                  key={speech.id}
                  speaker={getPlayerName(speech.playerId)}
                  content={speech.content}
                  timestamp={speech.timestamp}
                  isCurrentSpeaker={speech.playerId === currentSpeakerId}
                  onReference={() => onReference?.(speech.id)}
                  referencedSpeeches={getReferencedSpeeches?.(speech.id)}
                />
              </motion.div>
            ))}
            {streamingSpeech && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SpeechRecord
                  speaker={getPlayerName(streamingSpeech.playerId)}
                  content={streamingSpeech.content}
                  timestamp={new Date().toISOString()}
                  isCurrentSpeaker={streamingSpeech.playerId === currentSpeakerId}
                  streaming
                />
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </Container>
  );
}; 