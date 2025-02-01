import React from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: ${props => props.theme.colors.background.default};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.xl};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const StartButton = styled.button`
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  border: none;
  border-radius: ${props => props.theme.radius.lg};
  font-size: ${props => props.theme.typography.fontSize.lg};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    transform: scale(1.05);
    background-color: ${props => props.theme.colors.primaryDark};
  }
`;

const Description = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.md};
  text-align: center;
  max-width: 600px;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

export const GameStart: React.FC = () => {
  const navigate = useNavigate();

  const handleStartGame = () => {
    navigate('/game-config');
  };

  return (
    <Container>
      <Title>AI辩论赛</Title>
      <Description>
        欢迎来到AI辩论赛！在这里，您可以体验一场激动人心的辩论比赛。
        选择您的角色，加入辩论，展示您的才智！
      </Description>
      <StartButton onClick={handleStartGame}>
        开始游戏
      </StartButton>
    </Container>
  );
};

export default GameStart; 