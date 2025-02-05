import React from 'react';
import styled from '@emotion/styled';
import type { Player } from '../../types';
import { formatTimestamp, convertNumberToTimestamp } from '../../utils/timestamp';

interface SpeechBubbleProps {
  player: Player;
  content: string;
  timestamp: string | number;
  isInnerThought?: boolean;
}

interface ContainerProps {
  isInnerThought?: boolean;
  role: Player['role'];
}

const Container = styled.div<ContainerProps>`
  display: flex;
  flex-direction: column;
  max-width: 80%;
  margin: ${props => props.theme.spacing.sm} 0;
  align-self: ${props => props.isInnerThought ? 'flex-end' : 'flex-start'};

  ${props => {
    const roleColors = {
      for: props.theme.colors.success,
      against: props.theme.colors.error,
      neutral: props.theme.colors.secondary
    };
    return `
      border-left: 4px solid ${props.isInnerThought ? props.theme.colors.accent : roleColors[props.role]};
    `;
  }}
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const Avatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
`;

const PlayerName = styled.span`
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  color: ${props => props.theme.colors.text.primary};
`;

const Timestamp = styled.span`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.tertiary};
`;

const BubbleContent = styled.div<{ isInnerThought?: boolean }>`
  background-color: ${props => props.isInnerThought ? props.theme.colors.accent + '10' : props.theme.colors.white};
  border-radius: ${props => props.theme.radius.lg};
  padding: ${props => props.theme.spacing.md};
  box-shadow: ${props => props.theme.shadows.sm};
  font-size: ${props => props.theme.typography.fontSize.md};
  line-height: ${props => props.theme.typography.lineHeight.relaxed};
  color: ${props => props.theme.colors.text.primary};
  white-space: pre-wrap;
`;

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  player,
  content,
  timestamp,
  isInnerThought = false
}) => {
  return (
    <Container isInnerThought={isInnerThought} role={player.role}>
      <Header>
        <Avatar src={player.avatar} alt={player.name} />
        <PlayerName>{player.name}</PlayerName>
        <Timestamp>
          {formatTimestamp(typeof timestamp === 'number' ? convertNumberToTimestamp(timestamp) : timestamp)}
        </Timestamp>
      </Header>
      <BubbleContent isInnerThought={isInnerThought}>
        {content}
      </BubbleContent>
    </Container>
  );
};

export default SpeechBubble; 