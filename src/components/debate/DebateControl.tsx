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
  background-color: var(--color-bg-white);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
`;

const RoundDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--color-bg-light);
  border-radius: 4px;
  font-weight: bold;
`;

const SpeakerInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background-color: var(--color-primary);
          color: white;
          &:hover {
            background-color: var(--color-primary-dark);
          }
        `;
      case 'danger':
        return `
          background-color: var(--color-error);
          color: white;
          &:hover {
            background-color: var(--color-error-dark);
          }
        `;
      default:
        return `
          background-color: var(--color-bg-light);
          color: var(--color-text-primary);
          &:hover {
            background-color: var(--color-bg-hover);
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
  const isLastRound = roundInfo.currentRound === roundInfo.totalRounds;
  const isLastSpeaker = roundInfo.speakingOrder.indexOf(roundInfo.currentSpeaker || '') === roundInfo.speakingOrder.length - 1;

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

      {status !== 'preparing' && roundInfo.nextSpeaker && (
        <SpeakerInfo>
          <SpeakerLabel>下一位</SpeakerLabel>
          <SpeakerName>{getPlayerName(roundInfo.nextSpeaker)}</SpeakerName>
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

          <Button
            variant="primary"
            onClick={onNextSpeaker}
            disabled={!roundInfo.currentSpeaker}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            下一位发言
          </Button>

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