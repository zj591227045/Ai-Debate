import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

interface EliminatedPlayer {
  playerId: string;
  name: string;
  reason: string;
  rank: number;
}

interface EliminationAnnouncementProps {
  show: boolean;
  eliminatedPlayers: EliminatedPlayer[];
  onClose: () => void;
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Container = styled(motion.div)`
  background-color: ${props => props.theme.colors.background.default};
  border-radius: ${props => props.theme.radius.lg};
  padding: ${props => props.theme.spacing.xl};
  max-width: 500px;
  width: 90%;
  box-shadow: ${props => props.theme.shadows.lg};
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.error};
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  font-size: ${props => props.theme.typography.fontSize.xl};
`;

const PlayerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const PlayerCard = styled.div`
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const PlayerName = styled.div`
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
`;

const PlayerRank = styled.div`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const PlayerReason = styled.div`
  font-size: ${props => props.theme.typography.fontSize.md};
  color: ${props => props.theme.colors.text.primary};
`;

const CloseButton = styled.button`
  margin-top: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.radius.md};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.md};
  width: 100%;
  transition: background-color ${props => props.theme.transitions.fast};

  &:hover {
    background-color: ${props => props.theme.colors.primaryDark};
  }
`;

export const EliminationAnnouncement = React.forwardRef<HTMLDivElement, EliminationAnnouncementProps>(
  ({ show, eliminatedPlayers, onClose }, ref) => {
    if (!show) return null;

    return (
      <Overlay
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <Container
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <Title>淘汰公告</Title>
          <PlayerList>
            {eliminatedPlayers.map((player) => (
              <PlayerCard key={player.playerId}>
                <PlayerName>{player.name}</PlayerName>
                <PlayerRank>最终排名：第 {player.rank} 名</PlayerRank>
                <PlayerReason>{player.reason}</PlayerReason>
              </PlayerCard>
            ))}
          </PlayerList>
          <CloseButton onClick={onClose}>
            继续比赛
          </CloseButton>
        </Container>
      </Overlay>
    );
  }
);

EliminationAnnouncement.displayName = 'EliminationAnnouncement';

export default EliminationAnnouncement; 
