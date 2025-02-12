import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useStore } from '../../modules/state';
import { StateLogger } from '../../modules/state/utils';
import { StoreManager } from '../../modules/state/core/StoreManager';

const Container = styled.div`
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 400px;
  max-height: 600px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  border-radius: 8px;
  padding: 16px;
  font-family: monospace;
  z-index: 9999;
  overflow: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Title = styled.h3`
  margin: 0;
  color: #1890ff;
`;

const Button = styled.button`
  background: #1890ff;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

const StateView = styled.pre`
  font-size: 12px;
  line-height: 1.4;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const LogEntry = styled.div<{ $level: string }>`
  margin: 4px 0;
  padding: 4px;
  border-radius: 4px;
  font-size: 12px;
  background: ${props => {
    switch (props.$level) {
      case 'error': return 'rgba(255, 77, 79, 0.2)';
      case 'warn': return 'rgba(250, 173, 20, 0.2)';
      case 'info': return 'rgba(24, 144, 255, 0.2)';
      default: return 'transparent';
    }
  }};
  color: ${props => {
    switch (props.$level) {
      case 'error': return '#ff4d4f';
      case 'warn': return '#faad14';
      case 'info': return '#1890ff';
      default: return '#fff';
    }
  }};
`;

export const StateDebugger: React.FC = () => {
  const { state: gameConfig } = useStore('gameConfig');
  const { state: modelState } = useStore('model');
  const { state: gameRules } = useStore('gameRules');
  const [isVisible, setIsVisible] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const logger = StateLogger.getInstance();

  useEffect(() => {
    logger.debug('StateDebugger', '状态已更新', {
      timestamp: new Date().toISOString(),
      gameConfig,
      modelState,
      gameRules
    });

    setLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message: '状态已更新',
      data: { gameConfig, modelState, gameRules }
    }]);
  }, [gameConfig, modelState, gameRules]);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  if (!isVisible) {
    return (
      <Button
        style={{ position: 'fixed', right: '20px', bottom: '20px' }}
        onClick={toggleVisibility}
      >
        显示状态
      </Button>
    );
  }

  return (
    <Container>
      <Header>
        <Title>状态调试器</Title>
        <div>
          <Button onClick={clearLogs} style={{ marginRight: '8px' }}>
            清除日志
          </Button>
          <Button onClick={toggleVisibility}>
            隐藏
          </Button>
        </div>
      </Header>
      <div>
        <h4 style={{ color: '#1890ff', margin: '8px 0' }}>游戏配置：</h4>
        <StateView>
          {JSON.stringify(gameConfig, null, 2)}
        </StateView>
        
        <h4 style={{ color: '#1890ff', margin: '8px 0' }}>模型状态：</h4>
        <StateView>
          {JSON.stringify(modelState, null, 2)}
        </StateView>
        
        <h4 style={{ color: '#1890ff', margin: '8px 0' }}>游戏规则：</h4>
        <StateView>
          {JSON.stringify(gameRules, null, 2)}
        </StateView>
      </div>
      <div style={{ marginTop: '16px' }}>
        {logs.map((log, index) => (
          <LogEntry key={index} $level={log.level}>
            <div>[{new Date(log.timestamp).toLocaleTimeString()}] {log.message}</div>
            <pre>{JSON.stringify(log.data, null, 2)}</pre>
          </LogEntry>
        ))}
      </div>
    </Container>
  );
}; 