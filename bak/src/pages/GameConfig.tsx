import React from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { RoleAssignmentPanel } from '../components/debate/RoleAssignmentPanel';
import { useRoleAssignment, Player, DebateRole } from '../hooks/useRoleAssignment';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${props => props.theme.colors.background.default};
  padding: ${props => props.theme.spacing.lg};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.xl};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background-color: ${props => 
    props.variant === 'primary' ? props.theme.colors.primary : props.theme.colors.background.secondary
  };
  color: ${props => 
    props.variant === 'primary' ? props.theme.colors.white : props.theme.colors.text.primary
  };
  border: none;
  border-radius: ${props => props.theme.radius.md};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  margin-left: ${props => props.theme.spacing.md};

  &:hover {
    opacity: 0.9;
  }
`;

// 初始AI玩家
const initialPlayers: Player[] = [
  { id: '1', name: 'AI选手1', role: 'unassigned' as DebateRole, isAI: true },
  { id: '2', name: 'AI选手2', role: 'unassigned' as DebateRole, isAI: true },
  { id: '3', name: 'AI选手3', role: 'unassigned' as DebateRole, isAI: true },
  { id: '4', name: 'AI选手4', role: 'unassigned' as DebateRole, isAI: true },
];

const initialConfig = {
  affirmativeCount: 2,
  negativeCount: 2,
  judgeCount: 0,
  timekeeperCount: 0,
  minPlayers: 4,
  maxPlayers: 6,
  autoAssign: false,
};

export const GameConfig: React.FC = () => {
  const navigate = useNavigate();
  const {
    players,
    config,
    assignRole,
    updatePlayer,
    addPlayer,
    removePlayer,
    autoAssignRoles,
    resetRoles,
    getAssignedCount,
  } = useRoleAssignment(initialPlayers, initialConfig);

  const handleBack = () => {
    navigate('/');
  };

  const handleStartDebate = () => {
    // 检查是否所有角色都已分配
    const affirmative = players.filter(p => p.role.startsWith('affirmative')).length;
    const negative = players.filter(p => p.role.startsWith('negative')).length;

    if (affirmative < 2 || negative < 2) {
      alert('请确保正方和反方各有两名选手！');
      return;
    }

    // 将玩家配置传递给辩论室页面
    navigate('/debate-room', { 
      state: { 
        players,
        config 
      }
    });
  };

  const handleAddAIPlayer = () => {
    const playerNumber = players.length + 1;
    addPlayer(`AI选手${playerNumber}`, true);
  };

  const handleTakeoverPlayer = (playerId: string, playerName: string) => {
    updatePlayer(playerId, {
      name: playerName,
      isAI: false,
    });
  };

  return (
    <Container>
      <Header>
        <Title>游戏配置</Title>
        <div>
          <Button variant="secondary" onClick={handleBack}>
            返回
          </Button>
          <Button variant="primary" onClick={handleStartDebate}>
            开始辩论
          </Button>
        </div>
      </Header>

      <RoleAssignmentPanel
        players={players}
        config={config}
        onAssignRole={assignRole}
        onAutoAssign={autoAssignRoles}
        onReset={resetRoles}
        onTakeoverPlayer={handleTakeoverPlayer}
        onRemovePlayer={removePlayer}
        onAddAIPlayer={players.length < config.maxPlayers ? handleAddAIPlayer : undefined}
        onStartDebate={handleStartDebate}
      />
    </Container>
  );
};

export default GameConfig; 