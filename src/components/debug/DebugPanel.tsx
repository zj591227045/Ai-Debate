import React from 'react';
import styled from '@emotion/styled';

const DebugContainer = styled.div`
  position: fixed;
  right: 20px;
  top: 20px;
  width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 1000;
  max-height: 80vh;
  overflow-y: auto;
`;

const DebugHeader = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #1f1f1f;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
`;

const DebugContent = styled.div`
  font-size: 13px;
  color: #666;

  > div {
    margin-bottom: 8px;
  }
`;

interface DebugPanelProps {
  children: React.ReactNode;
  title?: string;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ 
  children,
  title = '调试信息'
}) => (
  <DebugContainer>
    <DebugHeader>{title}</DebugHeader>
    <DebugContent>
      {children}
    </DebugContent>
  </DebugContainer>
); 