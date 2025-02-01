import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Player, DebateRole, RoleAssignmentConfig } from '../../hooks/useRoleAssignment';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.radius.lg};
  box-shadow: ${props => props.theme.shadows.md};
`;

const ControlPanel = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${props => {
    switch (props.variant) {
      case 'primary':
        return props.theme.colors.primary;
      case 'danger':
        return props.theme.colors.error;
      default:
        return props.theme.colors.background.secondary;
    }
  }};
  color: ${props => 
    props.variant === 'secondary' ? props.theme.colors.text.primary : props.theme.colors.white
  };
  border: none;
  border-radius: ${props => props.theme.radius.md};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PlayerList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.md};
`;

const PlayerCard = styled.div<{ isAI: boolean }>`
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.radius.md};
  border-left: 4px solid ${props => 
    props.isAI ? props.theme.colors.secondary : props.theme.colors.accent
  };
`;

const PlayerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const PlayerName = styled.div`
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
`;

const PlayerType = styled.div<{ isAI: boolean }>`
  padding: ${props => `${props.theme.spacing.xs} ${props.theme.spacing.sm}`};
  background-color: ${props => 
    props.isAI ? props.theme.colors.secondary + '20' : props.theme.colors.accent + '20'
  };
  color: ${props => 
    props.isAI ? props.theme.colors.secondary : props.theme.colors.accent
  };
  border-radius: ${props => props.theme.radius.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

const RoleSelect = styled.select`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  background-color: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.md};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const PlayerActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
`;

const TakeoverDialog = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.radius.lg};
  box-shadow: ${props => props.theme.shadows.lg};
  z-index: 1000;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const Input = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  margin-bottom: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.md};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

interface RoleAssignmentPanelProps {
  players: Player[];
  config: RoleAssignmentConfig;
  onAssignRole: (playerId: string, role: DebateRole) => void;
  onAutoAssign: () => void;
  onReset: () => void;
  onTakeoverPlayer: (playerId: string, playerName: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onAddAIPlayer?: () => void;
  onStartDebate: () => void;
}

const getPlayerAvatar = (playerId: string, isAI: boolean) => {
  // 这里可以根据playerId和isAI返回不同的头像URL
  return isAI ? '/ai-avatar.png' : '/human-avatar.png';
};

export const RoleAssignmentPanel: React.FC<RoleAssignmentPanelProps> = ({
  players,
  config,
  onAssignRole,
  onAutoAssign,
  onReset,
  onTakeoverPlayer,
  onRemovePlayer,
  onAddAIPlayer,
  onStartDebate,
}) => {
  const [takeoverDialogOpen, setTakeoverDialogOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleTakeover = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setTakeoverDialogOpen(true);
    setNewPlayerName('');
  };

  const handleTakeoverConfirm = () => {
    if (selectedPlayerId && newPlayerName.trim()) {
      onTakeoverPlayer(selectedPlayerId, newPlayerName.trim());
      setTakeoverDialogOpen(false);
      setSelectedPlayerId(null);
      setNewPlayerName('');
    }
  };

  const isOptionalPlayer = (index: number) => {
    return index >= config.minPlayers;
  };

  return (
    <Container>
      <ControlPanel>
        <Button variant="primary" onClick={onAutoAssign}>
          自动分配角色
        </Button>
        <Button variant="secondary" onClick={onReset}>
          重置角色
        </Button>
        {onAddAIPlayer && (
          <Button variant="secondary" onClick={onAddAIPlayer}>
            添加AI选手
          </Button>
        )}
      </ControlPanel>

      <PlayerList>
        {players.map((player, index) => (
          <PlayerCard key={player.id} isAI={player.isAI}>
            <PlayerHeader>
              <PlayerName>{player.name}</PlayerName>
              <PlayerType isAI={player.isAI}>
                {player.isAI ? 'AI' : '玩家'}
              </PlayerType>
            </PlayerHeader>

            <RoleSelect
              value={player.role}
              onChange={(e) => onAssignRole(player.id, e.target.value as DebateRole)}
            >
              <option value="unassigned">未分配</option>
              <option value="affirmative1">正方一辩</option>
              <option value="affirmative2">正方二辩</option>
              <option value="negative1">反方一辩</option>
              <option value="negative2">反方二辩</option>
              <option value="judge">裁判</option>
              <option value="timekeeper">计时员</option>
            </RoleSelect>

            <PlayerActions>
              {player.isAI && (
                <Button variant="secondary" onClick={() => handleTakeover(player.id)}>
                  接管
                </Button>
              )}
              {isOptionalPlayer(index) && (
                <Button variant="danger" onClick={() => onRemovePlayer(player.id)}>
                  移除
                </Button>
              )}
            </PlayerActions>
          </PlayerCard>
        ))}
      </PlayerList>

      {takeoverDialogOpen && (
        <>
          <Overlay onClick={() => setTakeoverDialogOpen(false)} />
          <TakeoverDialog>
            <h3>接管AI选手</h3>
            <Input
              type="text"
              placeholder="输入您的名字"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              autoFocus
            />
            <Button variant="primary" onClick={handleTakeoverConfirm}>
              确认
            </Button>
            <Button variant="secondary" onClick={() => setTakeoverDialogOpen(false)}>
              取消
            </Button>
          </TakeoverDialog>
        </>
      )}
    </Container>
  );
};

export default RoleAssignmentPanel; 