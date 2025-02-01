import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';

interface DebateRoomLayoutProps {
  header: React.ReactNode;
  players: React.ReactNode;
  main: React.ReactNode;
  control: React.ReactNode;
  isRulesExpanded?: boolean;
}

const Container = styled.div<{ isRulesExpanded?: boolean }>`
  display: grid;
  grid-template-areas:
    "header header"
    "players main"
    "control control";
  grid-template-columns: minmax(300px, auto) 1fr;
  grid-template-rows: ${props => props.isRulesExpanded ? '180px' : '120px'} 1fr auto;
  height: 100%;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.default};
  transition: all ${props => props.theme.transitions.normal};
`;

const HeaderSection = styled.header`
  grid-area: header;
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.radius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  z-index: 10;
  overflow: hidden;
  min-height: 0;
`;

const PlayersSection = styled.aside`
  grid-area: players;
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.radius.lg};
  overflow: hidden;
  min-width: 300px;
  max-width: 400px;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const MainSection = styled.main`
  grid-area: main;
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.radius.lg};
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const ControlSection = styled.footer`
  grid-area: control;
  background-color: ${props => props.theme.colors.white};
  border-radius: ${props => props.theme.radius.lg};
  display: flex;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const Resizer = styled.div`
  position: absolute;
  right: -5px;
  top: 0;
  bottom: 0;
  width: 10px;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.2s;
  z-index: 10;

  &:hover {
    background-color: ${props => props.theme.colors.primary}20;
  }

  &:active {
    background-color: ${props => props.theme.colors.primary}40;
  }
`;

// 响应式布局样式
const ResponsiveContainer = styled(Container)`
  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-areas:
      "header"
      "main"
      "control";
    grid-template-columns: 1fr;

    ${PlayersSection} {
      display: none;
    }
  }
`;

export const DebateRoomLayout: React.FC<DebateRoomLayoutProps> = ({
  header,
  players,
  main,
  control,
  isRulesExpanded = true
}) => {
  const [playerListWidth, setPlayerListWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 600) {
        setPlayerListWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <ResponsiveContainer isRulesExpanded={isRulesExpanded}>
      <HeaderSection>{header}</HeaderSection>
      <PlayersSection>
        {players}
      </PlayersSection>
      <MainSection>{main}</MainSection>
      <ControlSection>{control}</ControlSection>
    </ResponsiveContainer>
  );
};

export default DebateRoomLayout; 