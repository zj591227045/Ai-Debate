import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../styles/ThemeContext';

export interface HeaderProps {
  topic: string;
  topicDescription?: string;
  currentRound: number;
  totalRounds: number;
  rules?: string[];
  onRulesExpandChange?: (expanded: boolean) => void;
}

const HeaderContainer = styled.div`
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.radius.lg};
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: ${props => props.theme.shadows.sm};
  overflow: hidden;
`;

const TopSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.md};
  padding-bottom: ${props => props.theme.spacing.md};
  flex-shrink: 0;
`;

const TopicHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${props => props.theme.spacing.sm};
  flex: 1;
`;

const TopicLabel = styled.span`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  white-space: nowrap;
`;

const TopicTitle = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RoundInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.accent};
  border-radius: ${props => props.theme.radius.pill};
  white-space: nowrap;
`;

const RoundLabel = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

const RoundValue = styled.span`
  color: ${props => props.theme.colors.text.primary};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
`;

const RulesSection = styled.div<{ isExpanded: boolean }>`
  border-top: 1px solid ${props => props.theme.colors.border};
  transition: all ${props => props.theme.transitions.normal};
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: ${props => props.isExpanded ? '0' : '40px'};
  height: ${props => props.isExpanded ? '150%' : '40px'};
  overflow: hidden;
`;

const RulesHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: ${props => props.theme.spacing.md} 0;
  background-color: ${props => props.theme.colors.background.secondary};
  flex-shrink: 0;
  z-index: 1;
`;

const RulesTitle = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
`;

const RulesToggle = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  transition: transform ${props => props.theme.transitions.fast};
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
`;

const RulesContent = styled.div<{ isExpanded: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.xs};
  overflow-y: auto;
  opacity: ${props => props.isExpanded ? 1 : 0};
  max-height: ${props => props.isExpanded ? '150%' : '0'};
  height: ${props => props.isExpanded ? '150%' : '0'};
  transition: all ${props => props.theme.transitions.normal};
  flex: 1;
`;

const TopicDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  line-height: 1.1;
  margin: 0;
  margin-bottom: ${props => props.theme.spacing.xs};
  padding: 0 ${props => props.theme.spacing.xs};
`;

const RulesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: ${props => props.theme.typography.fontSize.sm};
  padding: 0 ${props => props.theme.spacing.xs};
`;

const RuleItem = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  line-height: 1.1;
  padding: 4px ${props => props.theme.spacing.xs};
  background-color: ${props => props.theme.colors.background.default}40;
  border-radius: ${props => props.theme.radius.sm};

  &:hover {
    background-color: ${props => props.theme.colors.background.default}80;
  }
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

export const Header: React.FC<HeaderProps> = ({
  topic,
  topicDescription,
  currentRound,
  totalRounds,
  rules = [],
  onRulesExpandChange
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [isRulesExpanded, setIsRulesExpanded] = useState(true);

  const handleRulesToggle = () => {
    const newState = !isRulesExpanded;
    setIsRulesExpanded(newState);
    onRulesExpandChange?.(newState);
  };

  return (
    <HeaderContainer>
      <TopSection>
        <TopicHeader>
          <TopicLabel>辩论主题：</TopicLabel>
          <TopicTitle>{topic}</TopicTitle>
        </TopicHeader>
        <RoundInfo>
          <RoundLabel>当前轮次</RoundLabel>
          <RoundValue>{currentRound} / {totalRounds}</RoundValue>
        </RoundInfo>
        <ThemeToggle onClick={toggleTheme} aria-label="切换主题">
          {isDark ? '🌞' : '🌙'}
        </ThemeToggle>
      </TopSection>

      <RulesSection isExpanded={isRulesExpanded}>
        <RulesHeader onClick={handleRulesToggle}>
          <RulesTitle>辩论规则与说明</RulesTitle>
          <RulesToggle>
            {isRulesExpanded ? '收起 ▼' : '展开 ▶'}
          </RulesToggle>
        </RulesHeader>
        <RulesContent isExpanded={isRulesExpanded}>
          {topicDescription && (
            <TopicDescription>{topicDescription}</TopicDescription>
          )}
          <RulesList>
            {rules.map((rule, index) => (
              <RuleItem key={index}>{rule}</RuleItem>
            ))}
          </RulesList>
        </RulesContent>
      </RulesSection>
    </HeaderContainer>
  );
};

export default Header; 