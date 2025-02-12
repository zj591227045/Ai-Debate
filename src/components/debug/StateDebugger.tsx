import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useUnifiedState } from '../../modules/state';
import { StoreManager } from '../../modules/state/core/StoreManager';
import { useStore } from '../../modules/state';
import { GameConfigStore } from '../../modules/state/stores/GameConfigStore';

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

const StateSection = styled.div`
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 8px;
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const SectionTitle = styled.h4`
  margin: 0;
  color: #1890ff;
`;

const UpdateTime = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
`;

const DebugContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  max-width: 400px;
  max-height: 300px;
  overflow: auto;
`;

const DebugSection = styled.div`
  margin-bottom: 10px;
`;

const DebugTitle = styled.h4`
  margin: 0 0 5px;
  color: #0f0;
`;

const gameConfigStore = GameConfigStore.getInstance();

export const StateDebugger: React.FC = () => {
  const { state: gameConfig } = useStore('gameConfig');
  const [isVisible, setIsVisible] = useState(true);
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
  const storeManager = StoreManager.getInstance();
  const [storeState, setStoreState] = useState(gameConfigStore.getState());

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // 监听状态变化
  useEffect(() => {
    const unsubscribe = gameConfigStore.subscribe((state) => {
      setStoreState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

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

  const getLastUpdateTime = (namespace: string) => {
    try {
      const store = storeManager.getStore(namespace);
      const metadata = store.getMetadata();
      return new Date(metadata.lastUpdated).toLocaleString();
    } catch {
      return '未知';
    }
  };

  return (
    <Container>
      <Header>
        <Title>状态调试器</Title>
        <div>
          <Button onClick={() => setViewMode(viewMode === 'simple' ? 'detailed' : 'simple')}>
            {viewMode === 'simple' ? '详细视图' : '简单视图'}
          </Button>
          <Button onClick={toggleVisibility}>隐藏</Button>
        </div>
      </Header>

      {viewMode === 'simple' ? (
        <>
          {gameConfig?.debate ? (
            <>
              <DebugSection>
                <DebugTitle>辩论配置</DebugTitle>
                <div>
                  主题: {gameConfig.debate.topic.title}
                  <br />
                  描述: {gameConfig.debate.topic.description}
                  <br />
                  回合: {gameConfig.debate.topic.rounds}
                </div>
              </DebugSection>

              <DebugSection>
                <DebugTitle>辩论规则</DebugTitle>
                <div>
                  格式: {gameConfig.debate.rules.debateFormat}
                  <br />
                  描述: {gameConfig.debate.rules.description}
                </div>
              </DebugSection>

              <DebugSection>
                <DebugTitle>玩家</DebugTitle>
                <div>
                  数量: {gameConfig.players?.length || 0}
                </div>
              </DebugSection>
            </>
          ) : (
            <div>加载中...</div>
          )}
        </>
      ) : (
        <StateView>
          {JSON.stringify(storeState, null, 2)}
        </StateView>
      )}
    </Container>
  );
}; 