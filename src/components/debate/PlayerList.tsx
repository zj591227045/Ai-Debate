import React from 'react';
import styled from '@emotion/styled';
import type { Player } from '../../types';
import { useTheme } from '@emotion/react';

interface PlayerListProps {
  players: Player[];
  currentSpeaker?: string;
  onPlayerClick?: (playerId: string) => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  width: 100%;
  height: 100%;
  padding: ${props => props.theme.spacing.md};
  overflow-y: auto;
  background-color: ${props => props.theme.colors.background.default};
`;

const PlayerCard = styled.div<{ isActive: boolean; role: Player['role'] }>`
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.radius.lg};
  padding: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.isActive ? props.theme.colors.primary : props.theme.colors.border};
  box-shadow: ${props => props.isActive ? props.theme.shadows.md : props.theme.shadows.sm};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 180px;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: ${props => props.theme.shadows.md};
    transform: translateY(-2px);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 6px;
    height: 100%;
    background-color: ${props => {
      const roleColors = {
        for: props.theme.colors.success,
        against: props.theme.colors.error,
        neutral: props.theme.colors.secondary
      };
      return roleColors[props.role];
    }};
  }
`;

const PlayerInfo = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: ${props => props.theme.spacing.md};
  width: 100%;
  height: 100%;
`;

const AvatarContainer = styled.div`
  width: 80px;
  height: 80px;
  position: relative;
  border-radius: ${props => props.theme.radius.md};
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.md};
  transition: all ${props => props.theme.transitions.fast};
`;

const Avatar = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform ${props => props.theme.transitions.fast};

  ${PlayerCard}:hover & {
    transform: scale(1.05);
  }
`;

const PlayerDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  flex: 1;
`;

const PlayerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const PlayerNameRole = styled.div`
  flex: 1;
  text-align: left;
`;

const PlayerName = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const PlayerRole = styled.div<{ role: Player['role'] }>`
  font-size: ${props => props.theme.typography.fontSize.md};
  color: ${props => {
    const roleColors = {
      for: props.theme.colors.success,
      against: props.theme.colors.error,
      neutral: props.theme.colors.secondary
    };
    return roleColors[props.role];
  }};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

const PlayerStatus = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => `${props.theme.spacing.xs} ${props.theme.spacing.sm}`};
  background-color: ${props => props.isActive ? props.theme.colors.success + '20' : props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.radius.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.isActive ? props.theme.colors.success : props.theme.colors.text.secondary};

  &::before {
    content: '${props => props.isActive ? '🟢' : '⚪'}';
    font-size: 0.8em;
  }
`;

const ScoreSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme.colors.background.secondary};
  padding: ${props => `${props.theme.spacing.sm} ${props.theme.spacing.md}`};
  border-radius: ${props => props.theme.radius.md};
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const ScoreLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSize.md};
  color: ${props => props.theme.colors.text.secondary};
`;

const Score = styled.span`
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.primary};
`;

const PlayerStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.sm};
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.radius.sm};
`;

const StatLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatValue = styled.span`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
`;

const getRoleText = (role: Player['role']): string => {
  switch (role) {
    case 'for':
      return '正方';
    case 'against':
      return '反方';
    case 'neutral':
      return '中立';
    default:
      return '未知';
  }
};

export const PlayerList: React.FC<PlayerListProps> = ({ 
  players,
  currentSpeaker,
  onPlayerClick
}) => {
  return (
    <Container>
      {players.map(player => {
        const isActive = player.id === currentSpeaker;
        return (
          <PlayerCard 
            key={player.id} 
            isActive={isActive} 
            role={player.role}
            onClick={() => onPlayerClick?.(player.id)}
          >
            <PlayerInfo>
              <AvatarContainer>
                <Avatar src={player.avatar} alt={player.name} />
              </AvatarContainer>
              <PlayerDetails>
                <PlayerHeader>
                  <PlayerNameRole>
                    <PlayerName>{player.name}</PlayerName>
                    <PlayerRole role={player.role}>{getRoleText(player.role)}</PlayerRole>
                  </PlayerNameRole>
                  <PlayerStatus isActive={isActive}>
                    {isActive ? '当前发言' : '等待中'}
                  </PlayerStatus>
                </PlayerHeader>
                
                <ScoreSection>
                  <ScoreLabel>得分</ScoreLabel>
                  <Score>{player.score}</Score>
                </ScoreSection>

                <PlayerStats>
                  <StatItem>
                    <StatLabel>发言顺序</StatLabel>
                    <StatValue>{player.id}</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>身份</StatLabel>
                    <StatValue>{player.role === 'for' ? '正方' : '反方'}</StatValue>
                  </StatItem>
                </PlayerStats>
              </PlayerDetails>
            </PlayerInfo>
          </PlayerCard>
        );
      })}
    </Container>
  );
};

export default PlayerList; 