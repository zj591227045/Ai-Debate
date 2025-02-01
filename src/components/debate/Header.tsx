import React from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../styles/ThemeContext';

export interface HeaderProps {
  topic: string;
  currentRound: number;
  totalRounds: number;
  timeLeft: number;
}

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => `${props.theme.spacing.sm} ${props.theme.spacing.md}`};
  height: 100%;
`;

const TopicSection = styled.div`
  flex: 1;
`;

const TopicTitle = styled.h1`
  margin: 0;
  font-size: ${props => props.theme.typography.fontSize.lg};
  color: ${props => props.theme.colors.text.primary};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
`;

const RoundSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin: 0 ${props => props.theme.spacing.xl};
`;

const RoundInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const RoundLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const RoundNumber = styled.span`
  font-size: ${props => props.theme.typography.fontSize.lg};
  color: ${props => props.theme.colors.primary};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
`;

const TimerSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
`;

const TimerLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const TimerDisplay = styled.div<{ isWarning: boolean }>`
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.isWarning ? props.theme.colors.warning : props.theme.colors.text.primary};
`;

const ThemeToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: ${props => props.theme.radius.pill};
  background-color: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  margin-left: ${props => props.theme.spacing.md};

  &:hover {
    background-color: ${props => props.theme.colors.background.accent};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}40;
  }
`;

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const Header: React.FC<HeaderProps> = ({
  topic,
  currentRound,
  totalRounds,
  timeLeft,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const isWarning = timeLeft <= 30; // 剩余30秒时显示警告颜色

  return (
    <HeaderContainer>
      <TopicSection>
        <TopicTitle>{topic}</TopicTitle>
      </TopicSection>

      <RoundSection>
        <RoundInfo>
          <RoundLabel>当前轮次</RoundLabel>
          <RoundNumber>
            {currentRound} / {totalRounds}
          </RoundNumber>
        </RoundInfo>
      </RoundSection>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <TimerSection>
          <TimerLabel>剩余时间</TimerLabel>
          <TimerDisplay isWarning={isWarning}>
            {formatTime(timeLeft)}
          </TimerDisplay>
        </TimerSection>

        <ThemeToggle onClick={toggleTheme} aria-label="切换主题">
          {isDark ? '🌞' : '🌙'}
        </ThemeToggle>
      </div>
    </HeaderContainer>
  );
};

export default Header; 