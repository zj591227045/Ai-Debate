import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../styles/ThemeContext';
import { useSpeechRecorder } from '../../hooks/debate/useSpeechRecorder';
import type { Speech } from '../../hooks/debate/useSpeechRecorder';
import { SpeechList } from './SpeechList';
import SpeechInput from './SpeechInput';
import type { UnifiedPlayer, BaseDebateSpeech } from '../../types/adapters';

export interface MainContentProps {
  players: UnifiedPlayer[];
  currentSpeaker?: string;
  onSpeechAdded?: (speech: Speech) => void;
  onSpeechEdited?: (speech: Speech) => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.radius.md};
  overflow: hidden;
  width: 100%;
`;

const Header = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.background.secondary};
`;

const Title = styled.h2`
  margin: 0;
  font-size: clamp(${props => props.theme.typography.fontSize.md}, 2vw, ${props => props.theme.typography.fontSize.lg});
  color: ${props => props.theme.colors.text.primary};
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.lg};
`;

const CurrentSpeaker = styled.div`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => `${props.theme.colors.primary}15`};
  color: ${props => props.theme.colors.primary};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  border-radius: ${props => props.theme.radius.sm};
  margin-top: ${props => props.theme.spacing.sm};
  border-left: 4px solid ${props => props.theme.colors.primary};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-size: clamp(${props => props.theme.typography.fontSize.sm}, 1.5vw, ${props => props.theme.typography.fontSize.md});

  &::before {
    content: '🎙️';
    font-size: clamp(${props => props.theme.typography.fontSize.md}, 2vw, ${props => props.theme.typography.fontSize.lg});
  }
`;

const convertToBaseDebateSpeech = (speech: Speech): BaseDebateSpeech => ({
  ...speech,
  timestamp: speech.timestamp.toISOString(),
  round: 1,
  references: speech.references || [],
  role: speech.type === 'innerThoughts' ? 'assistant' : 
        speech.type === 'system' ? 'system' : 'assistant',
  type: speech.type
});

export const MainContent: React.FC<MainContentProps> = ({
  players,
  currentSpeaker,
  onSpeechAdded,
  onSpeechEdited
}) => {
  const contentAreaRef = React.useRef<HTMLDivElement>(null);
  const [referencedSpeeches, setReferencedSpeeches] = useState<Speech[]>([]);
  
  const {
    speeches,
    addSpeech,
    editSpeech,
    getReferencedSpeeches
  } = useSpeechRecorder({
    maxLength: 1000,
    minLength: 10,
    onSpeechAdded: onSpeechAdded as ((speech: Speech) => void) | undefined,
    onSpeechEdited: onSpeechEdited as ((speech: Speech) => void) | undefined
  });

  const handleSubmitSpeech = async (content: string, type: 'speech' | 'innerThoughts' | 'system', references?: string[]) => {
    if (!currentSpeaker) return false;
    const currentPlayer = players.find(p => p.name === currentSpeaker);
    if (!currentPlayer) return false;
    
    const speech: Speech = {
      id: crypto.randomUUID(),
      playerId: currentPlayer.id,
      content,
      timestamp: new Date(),
      type,
      references: references || []
    };
    
    return await addSpeech(currentPlayer.id, content, type, references);
  };

  const handleReference = (speechId: string) => {
    const speech = speeches.find(s => s.id === speechId);
    if (speech) {
      setReferencedSpeeches(prev => [...prev, speech]);
    }
  };

  const handleClearReferences = () => {
    setReferencedSpeeches([]);
  };

  return (
    <Container>
      <Header>
        <Title>辩论内容</Title>
        {currentSpeaker && (
          <CurrentSpeaker>
            当前发言: {currentSpeaker}
          </CurrentSpeaker>
        )}
      </Header>
      
      <ContentArea ref={contentAreaRef}>
        <SpeechList
          players={players}
          currentSpeakerId={currentSpeaker ? players.find(p => p.name === currentSpeaker)?.id : undefined}
          speeches={speeches.map(convertToBaseDebateSpeech)}
          onReference={handleReference}
          getReferencedSpeeches={(speechId: string) => 
            getReferencedSpeeches(speechId).map(convertToBaseDebateSpeech)
          }
        />
      </ContentArea>

      {currentSpeaker && (
        <SpeechInput
          playerId={players.find(p => p.name === currentSpeaker)?.id || ''}
          onSubmit={handleSubmitSpeech}
          disabled={!currentSpeaker}
          maxLength={1000}
          minLength={10}
          referencedSpeeches={referencedSpeeches}
          onClearReferences={handleClearReferences}
        />
      )}
    </Container>
  );
};

export default MainContent; 
