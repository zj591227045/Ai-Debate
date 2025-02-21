import React from 'react';
import styled from '@emotion/styled';
import type { Player } from '../../types';
import { useTheme } from '@emotion/react';

interface PlayerListProps {
  players: Player[];
  currentSpeaker?: string;
  onPlayerClick?: (playerId: string) => void;
  isDarkMode?: boolean;
}

const Container = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  width: 100%;
  height: 100%;
  padding: ${props => props.theme.spacing.md};
  overflow-y: auto;
  background-color: ${props => props.isDarkMode ? '#2d2d2d' : '#f5f5f5'};
  color: ${props => props.isDarkMode ? '#ffffff' : '#1f1f1f'};

  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.isDarkMode ? '#4d4d4d' : '#e8e8e8'};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const PlayerCard = styled.div<{ isActive: boolean; role: Player['role']; isDarkMode?: boolean }>`
  background-color: ${props => props.isDarkMode ? '#1f1f1f' : '#ffffff'};
  border-radius: ${props => props.theme.radius.lg};
  padding: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.isActive ? props.theme.colors.primary : (props.isDarkMode ? '#3d3d3d' : '#e8e8e8')};
  box-shadow: ${props => props.isActive ? props.theme.shadows.md : props.theme.shadows.sm};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  color: ${props => props.isDarkMode ? '#ffffff' : '#1f1f1f'};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: ${props => props.theme.shadows.md};
    transform: translateY(-2px);
    background-color: ${props => props.isDarkMode ? '#2d2d2d' : '#fafafa'};
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
        for: props.isDarkMode ? '#52c41a' : '#389e0d',
        against: props.isDarkMode ? '#ff4d4f' : '#cf1322',
        neutral: props.isDarkMode ? '#1890ff' : '#096dd9'
      };
      return roleColors[props.role];
    }};
  }
`;

const PlayerInfo = styled.div<{ isDarkMode?: boolean }>`
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: ${props => props.theme.spacing.md};
  width: 100%;
  height: 100%;
  background-color: transparent;
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

const PlayerDetails = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  flex: 1;
`;

const PlayerHeader = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const PlayerNameRole = styled.div<{ isDarkMode?: boolean }>`
  flex: 1;
  text-align: left;
`;

const PlayerName = styled.div<{ isDarkMode?: boolean }>`
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.isDarkMode ? '#ffffff' : '#1f1f1f'};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const PlayerRole = styled.div<{ role: Player['role']; isDarkMode?: boolean }>`
  font-size: ${props => props.theme.typography.fontSize.md};
  color: ${props => {
    const roleColors = {
      for: props.isDarkMode ? '#52c41a' : '#389e0d',
      against: props.isDarkMode ? '#ff4d4f' : '#cf1322',
      neutral: props.isDarkMode ? '#1890ff' : '#096dd9'
    };
    return roleColors[props.role];
  }};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

const PlayerStatus = styled.div<{ isActive: boolean; isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => `${props.theme.spacing.xs} ${props.theme.spacing.sm}`};
  background-color: ${props => {
    if (props.isDarkMode) {
      return props.isActive ? 'rgba(82, 196, 26, 0.2)' : 'rgba(255, 255, 255, 0.1)';
    }
    return props.isActive ? 'rgba(82, 196, 26, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  }};
  border-radius: ${props => props.theme.radius.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => {
    if (props.isDarkMode) {
      return props.isActive ? '#52c41a' : '#a6a6a6';
    }
    return props.isActive ? '#389e0d' : '#666666';
  }};

  &::before {
    content: '${props => props.isActive ? '🟢' : '⚪'}';
    font-size: 0.8em;
  }
`;

const ScoreSection = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'};
  padding: ${props => `${props.theme.spacing.sm} ${props.theme.spacing.md}`};
  border-radius: ${props => props.theme.radius.md};
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const ScoreLabel = styled.span<{ isDarkMode?: boolean }>`
  font-size: ${props => props.theme.typography.fontSize.md};
  color: ${props => props.isDarkMode ? '#a6a6a6' : '#666666'};
`;

const Score = styled.span<{ isDarkMode?: boolean }>`
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.isDarkMode ? '#1890ff' : '#1890ff'};
`;

const PlayerStats = styled.div<{ isDarkMode?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.sm};
`;

const StatItem = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${props => props.theme.spacing.sm};
  background-color: ${props => props.isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'};
  border-radius: ${props => props.theme.radius.sm};
`;

const StatLabel = styled.span<{ isDarkMode?: boolean }>`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.isDarkMode ? '#a6a6a6' : '#666666'};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatValue = styled.span<{ isDarkMode?: boolean }>`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.isDarkMode ? '#ffffff' : '#1f1f1f'};
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
  onPlayerClick,
  isDarkMode = false
}) => {
  return (
    <Container isDarkMode={isDarkMode}>
      {players.map(player => {
        const isActive = player.id === currentSpeaker;
        return (
          <PlayerCard 
            key={player.id} 
            isActive={isActive} 
            role={player.role}
            isDarkMode={isDarkMode}
            onClick={() => onPlayerClick?.(player.id)}
          >
            <PlayerInfo isDarkMode={isDarkMode}>
              <AvatarContainer>
                <Avatar src={player.avatar} alt={player.name} />
              </AvatarContainer>
              <PlayerDetails isDarkMode={isDarkMode}>
                <PlayerHeader isDarkMode={isDarkMode}>
                  <PlayerNameRole isDarkMode={isDarkMode}>
                    <PlayerName isDarkMode={isDarkMode}>{player.name}</PlayerName>
                    <PlayerRole role={player.role} isDarkMode={isDarkMode}>{getRoleText(player.role)}</PlayerRole>
                  </PlayerNameRole>
                  <PlayerStatus isActive={isActive} isDarkMode={isDarkMode}>
                    {isActive ? '当前发言' : '等待中'}
                  </PlayerStatus>
                </PlayerHeader>
                
                <ScoreSection isDarkMode={isDarkMode}>
                  <ScoreLabel isDarkMode={isDarkMode}>得分</ScoreLabel>
                  <Score isDarkMode={isDarkMode}>{player.score}</Score>
                </ScoreSection>

                <PlayerStats isDarkMode={isDarkMode}>
                  <StatItem isDarkMode={isDarkMode}>
                    <StatLabel isDarkMode={isDarkMode}>发言顺序</StatLabel>
                    <StatValue isDarkMode={isDarkMode}>{player.id}</StatValue>
                  </StatItem>
                  <StatItem isDarkMode={isDarkMode}>
                    <StatLabel isDarkMode={isDarkMode}>身份</StatLabel>
                    <StatValue isDarkMode={isDarkMode}>{player.role === 'for' ? '正方' : '反方'}</StatValue>
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