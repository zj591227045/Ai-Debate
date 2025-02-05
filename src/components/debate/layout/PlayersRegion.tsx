import React from 'react';
import styled from '@emotion/styled';
import type { DebateRoomLayout, UnifiedPlayer } from '../../../types/adapters';

type PlayersComponents = DebateRoomLayout['regions']['players']['components'];
type PlayersStyle = DebateRoomLayout['regions']['players']['style'];

// 选手区域容器
const PlayersContainer = styled.div<{ style: PlayersStyle }>`
  display: flex;
  flex-direction: column;
  ${props => ({ ...props.style })}
`;

// 选手列表
const PlayerList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

// 选手卡片
const PlayerCard = styled.div<{ isActive: boolean; isSpeaking: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background-color: ${props => 
    props.isSpeaking 
      ? 'var(--color-primary-light)' 
      : props.isActive 
        ? 'var(--color-bg-hover)' 
        : 'var(--color-bg-white)'
  };
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;

  &:hover {
    background-color: var(--color-bg-hover);
  }
`;

// 统计区域
const Statistics = styled.div`
  padding: 16px;
  border-top: 1px solid var(--color-border);
`;

interface PlayersRegionProps {
  components: PlayersComponents;
  style: PlayersStyle;
  onPlayerClick?: (playerId: string) => void;
}

export const PlayersRegion: React.FC<PlayersRegionProps> = ({
  components,
  style,
  onPlayerClick
}) => {
  const { playerList, statistics } = components;

  // 计算选手得分
  const getPlayerScore = (playerId: string): number => {
    if (!statistics?.scores) return 0;
    return statistics.scores[playerId] || 0;
  };

  // 获取发言次数
  const getSpeakingCount = (playerId: string): number => {
    if (!statistics?.speakingCount) return 0;
    return statistics.speakingCount[playerId] || 0;
  };

  return (
    <PlayersContainer style={style}>
      <PlayerList>
        {playerList.players.map(player => (
          <PlayerCard
            key={player.id}
            isActive={player.id === playerList.currentSpeaker}
            isSpeaking={player.status === 'speaking'}
            onClick={() => onPlayerClick?.(player.id)}
          >
            <img
              src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id}`}
              alt={player.name}
              style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 12 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold' }}>{player.name}</div>
              <div style={{ fontSize: '0.9em', color: 'var(--color-text-secondary)' }}>
                {player.role === 'affirmative' ? '正方' : 
                 player.role === 'negative' ? '反方' : 
                 player.role === 'free' ? '自由辩手' : 
                 player.role === 'judge' ? '裁判' : '未分配'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>得分: {getPlayerScore(player.id)}</div>
              <div>发言: {getSpeakingCount(player.id)}次</div>
            </div>
          </PlayerCard>
        ))}
      </PlayerList>

      {statistics && (
        <Statistics>
          <h3>统计信息</h3>
          <div>
            {playerList.players.map(player => (
              <div key={player.id} style={{ marginBottom: 8 }}>
                <div>{player.name}</div>
                <div>
                  总得分: {getPlayerScore(player.id)} | 
                  发言次数: {getSpeakingCount(player.id)}
                </div>
              </div>
            ))}
          </div>
        </Statistics>
      )}
    </PlayersContainer>
  );
}; 