import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import type { Speech } from '../../hooks/debate/useSpeechRecorder';
import SpeechRecord from './SpeechRecord';

interface Player {
  id: string;
  name: string;
}

interface SpeechListProps {
  players: Player[];
  currentSpeakerId?: string;
  speeches: Speech[];
  onReference?: (speechId: string) => void;
  getReferencedSpeeches: (speechId: string) => Speech[];
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  height: 100%;
  overflow-y: auto;
`;

const SpeechContainer = styled(motion.div)<{ isSelf: boolean }>`
  display: flex;
  justify-content: ${props => props.isSelf ? 'flex-end' : 'flex-start'};
  width: 100%;
`;

const NoSpeeches = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: ${props => props.theme.colors.text.tertiary};
  font-size: ${props => props.theme.typography.fontSize.lg};
`;

const SpeechList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

export const SpeechListComponent: React.FC<SpeechListProps> = ({
  players,
  currentSpeakerId,
  speeches,
  onReference,
  getReferencedSpeeches
}) => {
  const getPlayerName = (playerId: string) => {
    return players.find(p => p.id === playerId)?.name || '未知选手';
  };

  if (speeches.length === 0) {
    return (
      <Container>
        <NoSpeeches>暂无发言记录</NoSpeeches>
      </Container>
    );
  }

  return (
    <Container>
      <SpeechList>
        {speeches.map((speech) => (
          <SpeechContainer
            key={speech.id}
            isSelf={speech.playerId === currentSpeakerId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SpeechRecord
              speech={speech}
              playerName={getPlayerName(speech.playerId)}
              onReference={onReference}
              referencedSpeeches={getReferencedSpeeches(speech.id)}
              isCurrentSpeaker={speech.playerId === currentSpeakerId}
            />
          </SpeechContainer>
        ))}
      </SpeechList>
    </Container>
  );
};

export default SpeechListComponent; 