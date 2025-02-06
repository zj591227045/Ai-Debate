import React from 'react';
import styled from '@emotion/styled';
import type { UnifiedPlayer } from '../../types/adapters';
import { AIPlayerCard } from './AIPlayerCard';

const ListContainer = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
`;

const ListHeader = styled.div`
  font-weight: 500;
  font-size: 13px;
  color: #1f1f1f;
  margin-bottom: 8px;
`;

// 使用 UnifiedPlayer 作为基础类型
interface AIPlayerListProps {
  players: Array<Omit<UnifiedPlayer, 'role'> & { role: string }>;
  currentSpeakerId?: string;
  onSelectPlayer: (player: UnifiedPlayer) => void;
  disabled?: boolean;
}

export const AIPlayerList: React.FC<AIPlayerListProps> = ({
  players,
  currentSpeakerId,
  onSelectPlayer,
  disabled = false
}) => {
  // 转换角色映射
  const mapRole = (role: string): UnifiedPlayer['role'] => {
    switch (role) {
      case 'affirmative1':
      case 'affirmative2':
        return 'affirmative';
      case 'negative1':
      case 'negative2':
        return 'negative';
      case 'timekeeper':
        return 'free';
      case 'judge':
        return 'judge';
      default:
        return 'unassigned';
    }
  };

  return (
    <ListContainer>
      <ListHeader>AI 玩家列表 ({players.length})</ListHeader>
      {players.map(player => {
        // 创建符合 UnifiedPlayer 类型的对象
        const unifiedPlayer: UnifiedPlayer = {
          ...player,
          role: mapRole(player.role)
        };

        return (
          <AIPlayerCard
            key={player.id}
            player={unifiedPlayer}
            isCurrentSpeaker={player.id === currentSpeakerId}
            onSelect={() => onSelectPlayer(unifiedPlayer)}
            disabled={disabled}
          />
        );
      })}
    </ListContainer>
  );
}; 