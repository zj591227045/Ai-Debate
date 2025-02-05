import React from 'react';
import styled from '@emotion/styled';
import type { DebateRoomLayout as DebateRoomLayoutType, StyleProperties } from '../../../types/adapters';

// 布局容器
const LayoutContainer = styled.div<{ template: string }>`
  width: 100%;
  height: 100vh;
  display: grid;
  grid-template: ${props => props.template};
  background-color: ${props => props.theme.colors.background.default};
`;

// 头部区域
const Header = styled.header<{ style: StyleProperties }>`
  grid-area: header;
  ${props => ({ ...props.style })}
`;

// 选手区域
const Players = styled.aside<{ style: StyleProperties }>`
  grid-area: players;
  ${props => ({ ...props.style })}
`;

// 内容区域
const Content = styled.main<{ style: StyleProperties }>`
  grid-area: content;
  ${props => ({ ...props.style })}
`;

interface DebateRoomLayoutProps {
  layout: DebateRoomLayoutType;
  headerContent: React.ReactNode;
  playersContent: React.ReactNode;
  contentContent: React.ReactNode;
}

export const DebateRoomLayout: React.FC<DebateRoomLayoutProps> = ({
  layout,
  headerContent,
  playersContent,
  contentContent
}) => {
  return (
    <LayoutContainer template={layout.grid.template}>
      <Header style={layout.regions.header.style}>
        {headerContent}
      </Header>
      <Players style={layout.regions.players.style}>
        {playersContent}
      </Players>
      <Content style={layout.regions.content.style}>
        {contentContent}
      </Content>
    </LayoutContainer>
  );
};

// 默认布局配置
export const defaultLayout: DebateRoomLayoutType = {
  grid: {
    template: `
      "header header header" 60px
      "players content content" 1fr
      / 25% 75% auto
    `
  },
  regions: {
    header: {
      components: {
        navigation: {
          backButton: true,
          roundInfo: true,
          themeSwitch: true,
          saveSession: true,
          debateControl: true
        },
        info: {
          topic: {
            title: '',
            background: ''
          },
          format: 'structured'
        },
        judge: {
          judge: null
        }
      },
      style: {
        height: '60px',
        padding: '0 20px',
        background: 'var(--color-bg-light)',
        boxShadow: 'var(--shadow-sm)'
      }
    },
    players: {
      components: {
        playerList: {
          players: [],
          currentSpeaker: undefined,
          nextSpeaker: undefined
        },
        statistics: {
          scores: {},
          speakingCount: {}
        }
      },
      style: {
        width: '25%',
        minWidth: '300px',
        maxWidth: '500px',
        background: 'var(--color-bg-light)',
        borderRight: '1px solid var(--color-border)'
      }
    },
    content: {
      components: {
        speechHistory: [],
        currentSpeech: undefined,
        innerThoughts: undefined,
        judgeComments: []
      },
      style: {
        flex: 1,
        padding: '20px',
        background: 'var(--color-bg-white)'
      }
    }
  },
  theme: {
    mode: 'light',
    colors: {
      // 主题色值配置
      primary: '#1890ff',
      secondary: '#f5f5f5',
      border: '#e8e8e8',
      text: '#000000',
      background: '#ffffff'
    }
  }
}; 