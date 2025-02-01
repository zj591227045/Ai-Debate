import React from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../../styles/ThemeContext';

const ToolbarContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background-color: ${props => props.theme.colors.background.primary};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  padding: 0 ${props => props.theme.spacing.lg};
  z-index: 1000;
  box-shadow: ${props => props.theme.shadows.sm};
`;

const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-left: auto;
`;

const ToolbarButton = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.pill};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  font-size: ${props => props.theme.typography.fontSize.sm};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  &:hover {
    background-color: ${props => props.theme.colors.background.accent};
  }

  &:active {
    transform: translateY(1px);
  }
`;

interface TopToolbarProps {
  onBack: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({ onBack }) => {
  return (
    <ToolbarContainer>
      <ToolbarLeft>
        <ToolbarButton onClick={onBack}>
          <span>←</span>
          返回配置
        </ToolbarButton>
      </ToolbarLeft>
      <ToolbarRight>
        {/* 预留位置，可以添加更多功能按钮 */}
      </ToolbarRight>
    </ToolbarContainer>
  );
};

export default TopToolbar; 