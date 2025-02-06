import React from 'react';
import styled from '@emotion/styled';
import type { UnifiedPlayer } from '../../types/adapters';

const Card = styled.div<{ isActive: boolean }>`
  background: ${props => props.isActive ? '#e6f7ff' : 'white'};
  border: 1px solid ${props => props.isActive ? '#91d5ff' : '#f0f0f0'};
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  transition: all 0.3s ease;

  &:hover {
    border-color: #40a9ff;
  }
`;

const PlayerInfo = styled.div`
  margin-bottom: 8px;

  > div {
    font-size: 13px;
    color: #666;
    margin-bottom: 4px;
  }
`;

const SelectButton = styled.button`
  width: 100%;
  padding: 6px 12px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s ease;

  &:hover {
    background: #40a9ff;
  }

  &:disabled {
    background: #d9d9d9;
    cursor: not-allowed;
  }
`;

interface AIPlayerCardProps {
  player: UnifiedPlayer;
  isCurrentSpeaker: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export const AIPlayerCard: React.FC<AIPlayerCardProps> = ({
  player,
  isCurrentSpeaker,
  onSelect,
  disabled = false
}) => (
  <Card isActive={isCurrentSpeaker}>
    <PlayerInfo>
      <div>名称：{player.name}</div>
      <div>角色：{player.role}</div>
      <div>状态：{player.status}</div>
    </PlayerInfo>
    <SelectButton 
      onClick={onSelect}
      disabled={disabled || isCurrentSpeaker}
    >
      {isCurrentSpeaker ? '当前发言者' : '设为当前发言者'}
    </SelectButton>
  </Card>
); 