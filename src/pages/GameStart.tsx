import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { keyframes } from '@emotion/react';

const waveAnimation = keyframes`
  0% {
    background-position: 0% 50%, 50% 50%, 100% 50%;
  }
  100% {
    background-position: 100% 50%, 150% 50%, 200% 50%;
  }
`;

const floatAnimation = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const glowAnimation = keyframes`
  0% {
    box-shadow: 0 0 5px #4facfe, 0 0 10px #4facfe, 0 0 15px #4facfe;
  }
  50% {
    box-shadow: 0 0 10px #4facfe, 0 0 20px #4facfe, 0 0 30px #4facfe;
  }
  100% {
    box-shadow: 0 0 5px #4facfe, 0 0 10px #4facfe, 0 0 15px #4facfe;
  }
`;

const gridAnimation = keyframes`
  0% {
    background-position: 0px 0px;
  }
  100% {
    background-position: 50px 50px;
  }
`;

const iconGlowAnimation = keyframes`
  0% {
    text-shadow: 
      0 0 10px rgba(167,187,255,0.5),
      0 0 20px rgba(167,187,255,0.3),
      0 0 30px rgba(167,187,255,0);
    opacity: 1;
  }
  50% {
    text-shadow: 
      0 0 15px rgba(167,187,255,0.8),
      0 0 30px rgba(167,187,255,0.6),
      0 0 45px rgba(167,187,255,0.4);
    opacity: 0.8;
  }
  100% {
    text-shadow: 
      0 0 10px rgba(167,187,255,0.5),
      0 0 20px rgba(167,187,255,0.3),
      0 0 30px rgba(167,187,255,0);
    opacity: 1;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: 
    linear-gradient(90deg, rgba(2,0,36,0.95) 0%, rgba(9,9,121,0.95) 35%, rgba(0,57,89,0.95) 100%),
    repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(167,187,255,0.1) 10px, rgba(167,187,255,0.1) 11px),
    repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(167,187,255,0.1) 10px, rgba(167,187,255,0.1) 11px);
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      linear-gradient(90deg, transparent 0%, rgba(167,187,255,0.1) 50%, transparent 100%),
      linear-gradient(90deg, transparent 0%, rgba(167,187,255,0.1) 50%, transparent 100%),
      linear-gradient(90deg, transparent 0%, rgba(167,187,255,0.1) 50%, transparent 100%);
    background-size: 200% 100%, 200% 100%, 200% 100%;
    animation: ${waveAnimation} 10s linear infinite;
    pointer-events: none;
  }

  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(rgba(167,187,255,0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(167,187,255,0.1) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: ${gridAnimation} 20s linear infinite;
    pointer-events: none;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.05);
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 
    0 8px 32px 0 rgba(31, 38, 135, 0.37),
    inset 0 0 30px rgba(167,187,255,0.1);
  border: 1px solid rgba(167,187,255,0.2);
  max-width: 800px;
  width: 90%;
`;

const Title = styled.h1`
  color: #E8F0FF;
  font-size: 4rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
  text-shadow: 
    0 0 10px rgba(167,187,255,0.5),
    0 0 20px rgba(167,187,255,0.3),
    0 0 30px rgba(167,187,255,0.2);
  animation: ${floatAnimation} 3s ease-in-out infinite;
`;

const Description = styled.p`
  color: rgba(232,240,255,0.9);
  font-size: 1.2rem;
  text-align: center;
  max-width: 600px;
  margin: 0 auto 3rem;
  line-height: 1.6;
  letter-spacing: 0.5px;
  text-shadow: 0 0 10px rgba(167,187,255,0.3);
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const StartButton = styled.button`
  padding: 1rem 3rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #E8F0FF;
  background: linear-gradient(45deg, rgba(9,9,121,0.9) 0%, rgba(0,57,89,0.9) 100%);
  border: 1px solid rgba(167,187,255,0.3);
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: ${glowAnimation} 2s ease-in-out infinite;

  &:hover {
    transform: scale(1.05);
    animation: none;
    box-shadow: 
      0 0 20px rgba(167,187,255,0.5),
      inset 0 0 20px rgba(167,187,255,0.3);
  }

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      120deg,
      transparent,
      rgba(167,187,255,0.3),
      transparent
    );
    transition: 0.5s;
  }

  &:hover:before {
    left: 100%;
  }
`;

const CircleDecoration = styled.div`
  position: absolute;
  border-radius: 50%;
  background: rgba(167,187,255,0.05);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(167,187,255,0.1);
  
  &.circle1 {
    width: 300px;
    height: 300px;
    top: -150px;
    left: -150px;
  }
  
  &.circle2 {
    width: 200px;
    height: 200px;
    bottom: -100px;
    right: -100px;
  }
`;

const AIIcon = styled.div`
  font-size: 5rem;
  margin-bottom: 1.5rem;
  color: #E8F0FF;
  background: linear-gradient(45deg, #E8F0FF, #4facfe);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: transform 0.3s ease;
  cursor: default;
  animation: ${iconGlowAnimation} 3s ease-in-out infinite;
  display: inline-block;

  &:hover {
    transform: scale(1.1) rotate(15deg);
  }
`;

export const GameStart: React.FC = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStartGame = () => {
    navigate('/game-config');
  };

  return (
    <Container>
      <CircleDecoration className="circle1" />
      <CircleDecoration className="circle2" />
      <ContentWrapper style={{ opacity: mounted ? 1 : 0, transition: 'opacity 1s ease-in' }}>
        <AIIcon>💫</AIIcon>
        <Title>AI大乱斗</Title>
        <Description>
          欢迎来到AI能力竞技场！在这里，多个AI大模型将展现令人惊叹的语言与推理能力。
          无论是妙语连珠的辩论对决、天马行空的故事创作、头脑风暴、剧本编写，
          还是沉浸式的场景模拟与角色扮演，都能让您体验AI的无限可能。
          准备好开启一场前所未有的智能体验了吗？
        </Description>
        <ButtonWrapper>
          <StartButton onClick={handleStartGame}>
            开启探索
          </StartButton>
        </ButtonWrapper>
      </ContentWrapper>
    </Container>
  );
};

export default GameStart; 