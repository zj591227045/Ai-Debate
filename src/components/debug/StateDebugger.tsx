import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { getStateManager } from '../../store/unified';
import type { UnifiedState } from '../../store/unified';
import { useCharacter } from '../../modules/character/context/CharacterContext';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

// 修改悬浮切换按钮样式和位置
const ToggleButton = styled.button<{ visible: boolean }>`
  position: fixed;
  bottom: ${props => props.visible ? '620px' : '20px'};
  right: 20px;
  background: rgba(0, 0, 0, 0.85);
  color: #00ff00;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  z-index: 10000;
  font-family: monospace;
  font-size: 12px;
  transition: all 0.3s ease-in-out;

  &:hover {
    background: rgba(0, 0, 0, 0.95);
    transform: scale(1.05);
  }
`;

const DebugContainer = styled.div<{ visible: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  max-height: 580px;
  background: rgba(0, 0, 0, 0.85);
  color: #00ff00;
  padding: 16px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  overflow: auto;
  z-index: 9999;
  opacity: ${props => props.visible ? 1 : 0};
  transform: translateY(${props => props.visible ? '0' : '100%'});
  transition: all 0.3s ease-in-out;
  visibility: ${props => props.visible ? 'visible' : 'hidden'};
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
`;

const DebugHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #333;
`;

const DebugTitle = styled.h3`
  margin: 0;
  color: #fff;
`;

const DebugButton = styled.button`
  background: #333;
  color: #fff;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 8px;

  &:hover {
    background: #444;
  }
`;

const DebugSection = styled.div`
  margin-bottom: 16px;
`;

const DebugSectionTitle = styled.h4`
  margin: 0 0 8px 0;
  color: #fff;
`;

const DebugContent = styled.pre`
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

export const StateDebugger: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(() => {
    // 从 localStorage 读取显示状态
    const saved = localStorage.getItem('debuggerVisible');
    return saved ? JSON.parse(saved) : false;
  });
  const [unifiedState, setUnifiedState] = useState<UnifiedState | null>(null);
  const { state: characterState } = useCharacter();
  const gameConfig = useSelector((state: RootState) => state.gameConfig);

  // 保存显示状态到 localStorage
  useEffect(() => {
    localStorage.setItem('debuggerVisible', JSON.stringify(isVisible));
  }, [isVisible]);

  useEffect(() => {
    const stateManager = getStateManager(gameConfig, characterState);
    if (stateManager) {
      setUnifiedState(stateManager.getState());
      
      // 订阅状态更新
      const unsubscribe = stateManager.subscribe(newState => {
        setUnifiedState(newState);
      });

      return () => unsubscribe();
    }
  }, [gameConfig, characterState]);

  const handleRefresh = () => {
    const stateManager = getStateManager(gameConfig, characterState);
    if (stateManager) {
      setUnifiedState(stateManager.getState());
    }
  };

  const handleSave = () => {
    const stateManager = getStateManager(gameConfig, characterState);
    if (stateManager) {
      stateManager.saveState();
    }
  };

  const handleLoad = () => {
    const stateManager = getStateManager(gameConfig, characterState);
    if (stateManager) {
      stateManager.loadState();
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (!unifiedState) {
    return null;
  }

  const renderStateSection = (
    title: string,
    data: any,
    expanded: boolean
  ) => (
    <DebugSection>
      <DebugSectionTitle>{title}</DebugSectionTitle>
      <DebugContent>
        {expanded 
          ? JSON.stringify(data, null, 2)
          : JSON.stringify({
              summary: {
                type: typeof data,
                keys: Object.keys(data),
                length: Object.keys(data).length
              }
            }, null, 2)
        }
      </DebugContent>
    </DebugSection>
  );

  return (
    <>
      <ToggleButton 
        onClick={toggleVisibility}
        visible={isVisible}
      >
        {isVisible ? '隐藏调试器' : '显示调试器'}
      </ToggleButton>
      <DebugContainer visible={isVisible}>
        <DebugHeader>
          <DebugTitle>状态调试器</DebugTitle>
          <div>
            <DebugButton onClick={handleRefresh}>刷新</DebugButton>
            <DebugButton onClick={handleSave}>保存</DebugButton>
            <DebugButton onClick={handleLoad}>加载</DebugButton>
            <DebugButton onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? '收起' : '展开'}
            </DebugButton>
          </div>
        </DebugHeader>

        {renderStateSection('角色状态', unifiedState.characters, isExpanded)}
        {renderStateSection('辩论状态', unifiedState.debate, isExpanded)}
        {renderStateSection('配置状态', unifiedState.config, isExpanded)}

        <DebugSection>
          <DebugSectionTitle>统计信息</DebugSectionTitle>
          <DebugContent>
            {JSON.stringify({
              角色数量: Object.keys(unifiedState.characters.byId).length,
              活跃角色: unifiedState.characters.activeCharacters.length,
              玩家数量: Object.keys(unifiedState.debate.players.byId).length,
              当前轮次: unifiedState.debate.currentState.round,
              对话状态: unifiedState.debate.currentState.status,
              最后更新: new Date(unifiedState.characters.meta.lastModified).toLocaleString()
            }, null, 2)}
          </DebugContent>
        </DebugSection>
      </DebugContainer>
    </>
  );
}; 