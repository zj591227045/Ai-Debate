import React from 'react';
import styled from '@emotion/styled';
import type { DebateRoomLayout } from '../../../types/adapters';

type HeaderComponents = DebateRoomLayout['regions']['header']['components'];
type HeaderStyle = DebateRoomLayout['regions']['header']['style'];

// 头部容器
const HeaderContainer = styled.div<{ style: HeaderStyle }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  ${props => ({ ...props.style })}
`;

// 导航区域
const Navigation = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

// 信息区域
const Info = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// 裁判区域
const Judge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface HeaderRegionProps {
  components: HeaderComponents;
  style: HeaderStyle;
  onBack: () => void;
  onSave: () => void;
  onThemeSwitch: () => void;
  onDebateControl: () => void;
}

export const HeaderRegion: React.FC<HeaderRegionProps> = ({
  components,
  style,
  onBack,
  onSave,
  onThemeSwitch,
  onDebateControl
}) => {
  const { navigation, info, judge } = components;

  return (
    <HeaderContainer style={style}>
      <Navigation>
        {navigation.backButton && (
          <button onClick={onBack}>返回</button>
        )}
        {navigation.roundInfo && info.currentRound && (
          <span>第 {info.currentRound}/4 轮</span>
        )}
        {navigation.themeSwitch && (
          <button onClick={onThemeSwitch}>切换主题</button>
        )}
        {navigation.saveSession && (
          <button onClick={onSave}>保存会话</button>
        )}
        {navigation.debateControl && (
          <button onClick={onDebateControl}>
            {info.currentRound ? '结束辩论' : '开始辩论'}
          </button>
        )}
      </Navigation>

      <Info>
        {info.topic && (
          <>
            <h2>{info.topic.title}</h2>
            <p>{info.topic.background}</p>
          </>
        )}
        {info.format && (
          <span>
            {info.format === 'structured' ? '结构化辩论' : '自由辩论'}
          </span>
        )}
      </Info>

      <Judge>
        {judge?.judge && (
          <>
            <img 
              src={judge.judge.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${judge.judge.id}`}
              alt={judge.judge.name}
              style={{ width: 32, height: 32, borderRadius: '50%' }}
            />
            <span>{judge.judge.name}</span>
          </>
        )}
      </Judge>
    </HeaderContainer>
  );
}; 