import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';

interface DebateRoomLayoutProps {
  header: React.ReactNode;
  players: React.ReactNode;
  main: React.ReactNode;
  control: React.ReactNode;
}

const Container = styled.div`
  display: grid;
  grid-template-areas:
    "header header"
    "players main"
    "control control";
  grid-template-columns: minmax(300px, auto) 1fr;
  grid-template-rows: 60px 1fr 80px;
  height: 100vh;
  background-color: ${props => props.theme.colors.background.default};
`;

const HeaderSection = styled.header`
  grid-area: header;
  background-color: ${props => props.theme.colors.white};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.sm};
  z-index: 10;
  padding: 0 ${props => props.theme.spacing.md};
`;

const PlayersSection = styled.aside`
  grid-area: players;
  background-color: ${props => props.theme.colors.white};
  border-right: 1px solid ${props => props.theme.colors.border};
  overflow-y: auto;
  width: 300px;
  min-width: 300px;
  max-width: 400px;
  height: calc(100vh - 140px);
`;

const MainSection = styled.main`
  grid-area: main;
  background-color: ${props => props.theme.colors.white};
  overflow-y: auto;
  padding: ${props => props.theme.spacing.md};
`;

const ControlSection = styled.footer`
  grid-area: control;
  background-color: ${props => props.theme.colors.white};
  border-top: 1px solid ${props => props.theme.colors.border};
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
  control
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
    <ResponsiveContainer>
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