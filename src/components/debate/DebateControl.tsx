import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

// 定义状态类型
type DebateStatus = 'preparing' | 'ongoing' | 'paused' | 'finished';

interface RoundInfo {
  currentRound: number;
  totalRounds: number;
  currentSpeaker?: string;
  nextSpeaker?: string;
  speakingOrder: string[];
}

// 样式定义
const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  --color-bg-white: #ffffff;
  --color-bg-light: #f5f5f5;
  --color-text-primary: #1f1f1f;
  --color-text-secondary: #666666;
  --color-primary: #1890ff;
  --color-primary-dark: #096dd9;
  --color-error: #ff4d4f;
  --color-error-dark: #f5222d;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const RoundDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--color-bg-light);
  border-radius: 4px;
  font-weight: bold;
  color: var(--color-text-primary);
`;

const SpeakerInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
`;

const SpeakerLabel = styled.span`
  font-size: 0.9em;
  color: var(--color-text-secondary);
`;

const SpeakerName = styled.span`
  font-weight: bold;
  color: var(--color-text-primary);
`;

const Button = styled(motion.button)<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid transparent;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 90px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background-color: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
          &:hover {
            background-color: var(--color-primary-dark);
            border-color: var(--color-primary-dark);
          }
        `;
      case 'danger':
        return `
          background-color: var(--color-error);
          color: white;
          border-color: var(--color-error);
          &:hover {
            background-color: var(--color-error-dark);
            border-color: var(--color-error-dark);
          }
        `;
      default:
        return `
          background-color: var(--color-bg-light);
          color: var(--color-text-primary);
          border-color: #d9d9d9;
          &:hover {
            color: var(--color-primary);
            border-color: var(--color-primary);
            background-color: white;
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    &:hover {
      opacity: 0.5;
    }
  }
`;

interface DebateControlProps {
  status: DebateStatus;
  roundInfo: RoundInfo;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onNextRound: () => void;
  onNextSpeaker: () => void;
  getPlayerName: (playerId: string) => string;
}

export const DebateControl: React.FC<DebateControlProps> = ({
  status,
  roundInfo,
  onStart,
  onPause,
  onResume,
  onEnd,
  onNextRound,
  onNextSpeaker,
  getPlayerName
}) => {
  // 检查是否是最后一轮
  const isLastRound = roundInfo.currentRound === roundInfo.totalRounds;
  
  // 检查是否是当前轮次的最后一个发言者
  const currentSpeakerIndex = roundInfo.speakingOrder.indexOf(roundInfo.currentSpeaker || '');
  const isLastSpeaker = currentSpeakerIndex === roundInfo.speakingOrder.length - 1;
  
  // 检查是否有下一个发言者
  const hasNextSpeaker = roundInfo.nextSpeaker && roundInfo.nextSpeaker !== roundInfo.currentSpeaker;

  // 调试信息
  console.log('辩论控制状态:', {
    status,
    currentRound: roundInfo.currentRound,
    totalRounds: roundInfo.totalRounds,
    currentSpeaker: roundInfo.currentSpeaker,
    nextSpeaker: roundInfo.nextSpeaker,
    speakingOrder: roundInfo.speakingOrder,
    isLastRound,
    isLastSpeaker,
    hasNextSpeaker
  });

  return (
    <Container>
      <RoundDisplay>
        第 {roundInfo.currentRound}/{roundInfo.totalRounds} 轮
      </RoundDisplay>

      {status !== 'preparing' && (
        <SpeakerInfo>
          <SpeakerLabel>当前发言</SpeakerLabel>
          <SpeakerName>
            {roundInfo.currentSpeaker ? 
              getPlayerName(roundInfo.currentSpeaker) : 
              '等待开始'}
          </SpeakerName>
        </SpeakerInfo>
      )}

      {status !== 'preparing' && hasNextSpeaker && (
        <SpeakerInfo>
          <SpeakerLabel>下一位</SpeakerLabel>
          <SpeakerName>{getPlayerName(roundInfo.nextSpeaker || '')}</SpeakerName>
        </SpeakerInfo>
      )}

      <div style={{ flex: 1 }} />

      {status === 'preparing' && (
        <Button
          variant="primary"
          onClick={onStart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          开始辩论
        </Button>
      )}

      {status === 'ongoing' && (
        <>
          <Button
            onClick={onPause}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            暂停
          </Button>

          {hasNextSpeaker && (
            <Button
              variant="primary"
              onClick={onNextSpeaker}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              下一位发言
            </Button>
          )}

          {isLastSpeaker && !isLastRound && (
            <Button
              variant="primary"
              onClick={onNextRound}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              进入下一轮
            </Button>
          )}

          {isLastSpeaker && isLastRound && (
            <Button
              variant="danger"
              onClick={onEnd}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              结束辩论
            </Button>
          )}
        </>
      )}

      {status === 'paused' && (
        <Button
          variant="primary"
          onClick={onResume}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          继续辩论
        </Button>
      )}

      {status === 'finished' && (
        <div style={{ 
          padding: '8px 16px',
          backgroundColor: 'var(--color-bg-light)',
          borderRadius: '4px',
          color: 'var(--color-text-secondary)'
        }}>
          辩论已结束
        </div>
      )}
    </Container>
  );
}; 