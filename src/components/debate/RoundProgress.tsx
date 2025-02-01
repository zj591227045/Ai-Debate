import React from 'react';
import styled from '@emotion/styled';

interface RoundProgressProps {
  currentRound: number;
  totalRounds: number;
  currentSpeaker?: string;
  speakingOrder: string[];
  completedSpeeches: number;
  totalSpeeches: number;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  width: 100%;
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 4px;
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.radius.sm};
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress}%;
    background-color: ${props => props.theme.colors.primary};
    transition: all ${props => props.theme.transitions.fast};
  }
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const RoundInfo = styled.div`
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

const SpeakerInfo = styled.div`
  color: ${props => props.theme.colors.text.primary};
`;

export const RoundProgress: React.FC<RoundProgressProps> = ({
  currentRound,
  totalRounds,
  currentSpeaker,
  speakingOrder,
  completedSpeeches,
  totalSpeeches
}) => {
  const progress = (completedSpeeches / totalSpeeches) * 100;
  const currentSpeakerIndex = currentSpeaker ? speakingOrder.indexOf(currentSpeaker) + 1 : 0;

  return (
    <Container>
      <InfoRow>
        <RoundInfo>
          第 {currentRound}/{totalRounds} 轮
        </RoundInfo>
        <SpeakerInfo>
          {currentSpeaker ? 
            `第 ${currentSpeakerIndex}/${totalSpeeches} 位发言` :
            '准备开始'
          }
        </SpeakerInfo>
      </InfoRow>
      <ProgressBar progress={progress} />
    </Container>
  );
};

export default RoundProgress; 