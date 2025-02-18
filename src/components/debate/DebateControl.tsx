import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { DebateStatus } from '../../modules/state/types/adapters';
import { Button, Space } from 'antd';
import { ScoringModal } from './ScoringModal';
import type { UnifiedPlayer, Score, BaseDebateSpeech } from '../../types/adapters';

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

const ButtonStyled = styled(motion.button)<{ variant?: 'primary' | 'secondary' | 'danger' }>`
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
  currentRound: number;
  totalRounds: number;
  currentSpeaker: UnifiedPlayer | null;
  nextSpeaker?: UnifiedPlayer | null;
  players: UnifiedPlayer[];
  onStartScoring: (status: DebateStatus) => void;
  onScoringComplete: (speech: BaseDebateSpeech) => void;
  onNextRound: () => void;
  onNextSpeaker: () => void;
  scoringRules: Array<{
    id: string;
    name: string;
    weight: number;
    description: string;
    criteria: string[];
  }>;
  judge: {
    id: string;
    name: string;
    avatar?: string;
    description?: string;
  } | null;
}

export const DebateControl: React.FC<DebateControlProps> = ({
  status,
  currentRound,
  totalRounds,
  currentSpeaker,
  nextSpeaker,
  players,
  onStartScoring,
  onScoringComplete,
  onNextRound,
  onNextSpeaker,
  scoringRules,
  judge
}) => {
  const [scoringModalVisible, setScoringModalVisible] = useState(false);

  useEffect(() => {
    //console.log('状态变更检测:', {
    //  status,
    //  scoringModalVisible,
    //  shouldShowModal: status === DebateStatus.SCORING
    //});

    if (status === DebateStatus.SCORING) {
      setScoringModalVisible(true);
    }
  }, [status]);

  //console.log('DebateControl渲染 - 当前状态:', {
  //  status,
  //  currentRound,
  //  totalRounds,
  //  currentSpeaker: currentSpeaker?.name,
  //  nextSpeaker: nextSpeaker?.name
  //});

  const handleStartScoring = () => {
    //console.log('点击开始评分按钮 - 当前状态:', {
    //  status,
    //  currentRound,
    //  totalRounds,
    //  modalVisible: scoringModalVisible
    //});
    
    if (status === DebateStatus.ROUND_COMPLETE) {
      setScoringModalVisible(true);
      onStartScoring(DebateStatus.SCORING);
    } else if (status === DebateStatus.PREPARING) {
      onStartScoring(DebateStatus.ONGOING);
    }
  };

  const handleScoringComplete = (speech: BaseDebateSpeech) => {
    //console.log('评分完成，准备进入下一轮:', {
    //  currentRound,
    //  totalRounds,
    //  status,
    //  speech,
    //  modalVisible: scoringModalVisible
    //});
    
    setScoringModalVisible(false);
    onScoringComplete(speech);
  };

  const handleModalClose = () => {
    console.log('关闭评分面板');
    setScoringModalVisible(false);
    if (status === DebateStatus.SCORING) {
      // 如果在评分状态下关闭，恢复到轮次完成状态
      onStartScoring(DebateStatus.ROUND_COMPLETE);
    }
  };

  const handleNextRound = () => {
    console.log('开始进入下一轮:', {
      currentRound,
      totalRounds,
      status
    });
    
    // 直接触发进入下一轮，不需要调用 handleNextSpeaker
    onNextRound();
  };

  const handleNextSpeaker = () => {
    console.log('点击下一位发言按钮');
    onNextSpeaker();
  };

  return (
    <>
      <Container>
        <RoundDisplay>
          第 {currentRound}/{totalRounds} 轮
        </RoundDisplay>

        {status !== DebateStatus.PREPARING && (
          <SpeakerInfo>
            <SpeakerLabel>当前发言</SpeakerLabel>
            <SpeakerName>
              {currentSpeaker ? 
                currentSpeaker.name : 
                '等待开始'}
            </SpeakerName>
          </SpeakerInfo>
        )}

        <div style={{ flex: 1 }} />

        {status === DebateStatus.PREPARING && (
          <ButtonStyled
            variant="primary"
            onClick={handleStartScoring}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            开始辩论
          </ButtonStyled>
        )}

        {status === DebateStatus.ONGOING && (
          <Space>
            <ButtonStyled
              variant="primary"
              onClick={handleNextSpeaker}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              下一位发言
            </ButtonStyled>
          </Space>
        )}

        {status === DebateStatus.ROUND_COMPLETE && (
          <Button 
            type="primary"
            onClick={handleStartScoring}
          >
            开始评分
          </Button>
        )}

        {status === DebateStatus.COMPLETED && (
          <div style={{ 
            padding: '8px 16px',
            color: 'var(--color-text-secondary)',
            fontWeight: 500
          }}>
            辩论已结束
          </div>
        )}
      </Container>

      <ScoringModal
        visible={scoringModalVisible}
        onClose={handleModalClose}
        players={players}
        currentRound={currentRound}
        judge={judge}
        scoringRules={scoringRules}
        onScoringComplete={handleScoringComplete}
        onNextRound={handleNextRound}
      />
    </>
  );
}; 