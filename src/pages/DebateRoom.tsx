import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from '@emotion/styled';
import { Tooltip, Divider } from 'antd';
import { 
  ArrowLeftOutlined,
  SaveOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  BulbOutlined,
  BulbFilled
} from '@ant-design/icons';
import { Resizable } from 're-resizable';
import type { RootState } from '../store';
import { useCharacter } from '../modules/character/context/CharacterContext';
import { useModel } from '../modules/model/context/ModelContext';
import type { CharacterConfig } from '../modules/character/types';
import type { CharacterState } from '../modules/character/context/CharacterContext';
//import type { CharacterError } from '../modules/character/types/error';
import { defaultTemplates, templateToCharacter } from '../modules/character/types/template';
import { StateDebugger } from '../components/debug/StateDebugger';
import { getStateManager } from '../store/unified';
import type { UnifiedState } from '../store/unified/types';
import { StateAdapter } from '../store/unified/adapters';

// 主容器
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: rgb(244, 245, 245);
  color: rgb(31, 31, 31);
`;

// 顶部工具栏
const TopBar = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  gap: 8px;
`;

const ToolButton = styled.button`
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;

  &:hover {
    background: #f5f5f5;
    color: #1890ff;
  }

  .anticon {
    margin-right: 4px;
  }
`;

// 主题信息区域
const TopicBar = styled.div`
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
`;

const TopicTitle = styled.h2`
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 500;
`;

const TopicInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #666;
  font-size: 14px;
`;

// 主内容区域
const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

// 左侧选手列表
const PlayerListSection = styled.div`
  background: white;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
`;

const PlayerCard = styled.div`
  padding: 16px;
  margin-bottom: 1px;
  background: white;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fafafa;
  }
`;

const PlayerAvatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
`;

const PlayerInfo = styled.div`
  flex: 1;
`;

const PlayerName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #333;
`;

const PlayerRole = styled.div`
  font-size: 12px;
  color: #999;
  margin-top: 2px;
`;

const CharacterInfo = styled.div`
  margin-top: 4px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CharacterName = styled.div`
  color: #1890ff;
  font-weight: 500;
  font-size: 13px;
`;

const CharacterDescription = styled.div`
  color: #666;
  font-size: 12px;
  margin: 2px 0;
`;

const CharacterPersona = styled.div`
  color: #8c8c8c;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 4px;
    background: #d9d9d9;
    border-radius: 50%;
  }
`;

const CharacterModel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 11px;
`;

const ModelBadge = styled.span<{ provider: string }>`
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  background: ${props => {
    const provider = (props.provider || '').toLowerCase();
    switch (provider) {
      case 'ollama':
        return '#f0f5ff';
      case 'openai':
        return '#f6ffed';
      case 'anthropic':
        return '#fff7e6';
      default:
        return '#f5f5f5';
    }
  }};
  color: ${props => {
    const provider = (props.provider || '').toLowerCase();
    switch (provider) {
      case 'ollama':
        return '#1890ff';
      case 'openai':
        return '#52c41a';
      case 'anthropic':
        return '#fa8c16';
      default:
        return '#8c8c8c';
    }
  }};
  border: 1px solid ${props => {
    const provider = (props.provider || '').toLowerCase();
    switch (provider) {
      case 'ollama':
        return '#bae7ff';
      case 'openai':
        return '#b7eb8f';
      case 'anthropic':
        return '#ffd591';
      default:
        return '#d9d9d9';
    }
  }};
`;

const ModelName = styled.span`
  color: #8c8c8c;
  font-size: 11px;
  
  &:before {
    content: '·';
    margin: 0 4px;
    color: #d9d9d9;
  }
`;

// 右侧辩论内容
const DebateContent = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: white;
  margin: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

// 添加类型适配器
const adaptStateFromStorage = (parsedState: any): CharacterState => ({
  characters: Array.isArray(parsedState.characters) ? parsedState.characters : [],
  templates: Array.isArray(parsedState.templates) ? parsedState.templates : [],
  activeMode: parsedState.activeMode || 'direct',
  difyConfig: {
    serverUrl: '',
    apiKey: '',
    workflowId: '',
    parameters: {},
    ...parsedState.difyConfig
  },
  directConfig: {
    provider: '',
    apiKey: '',
    model: '',
    parameters: {},
    ...parsedState.directConfig
  }
});

export const DebateRoom: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const gameConfig = useSelector((state: RootState) => state.gameConfig);
  const { state: characterState } = useCharacter();
  const { state: modelState } = useModel();
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [playerListWidth, setPlayerListWidth] = useState(300);
  const [unifiedState, setUnifiedState] = useState<UnifiedState | null>(null);
  const stateManagerRef = React.useRef<ReturnType<typeof getStateManager>>(null);

  // 初始化统一状态
  useEffect(() => {
    console.log('========== 初始化统一状态管理器 ==========');
    
    // 只在组件挂载时初始化一次状态管理器
    if (!stateManagerRef.current) {
      console.log('创建新的状态管理器');
      stateManagerRef.current = getStateManager(gameConfig, characterState);
      
      if (stateManagerRef.current) {
        // 尝试从本地存储加载状态
        const loadedFromStorage = stateManagerRef.current.loadState();
        console.log('从本地存储加载状态:', loadedFromStorage);
      }
    }

    // 获取并设置初始状态
    if (stateManagerRef.current) {
      const state = stateManagerRef.current.getState();
      console.log('当前状态:', {
        角色数量: Object.keys(state.characters.byId).length,
        玩家数量: Object.keys(state.debate.players.byId).length,
        当前状态: state.debate.currentState.status,
        主题: state.debate.topic,
        规则: state.debate.rules
      });
      
      setUnifiedState(state);
      setIsLoading(false);
    }
  }, []); // 空依赖数组，确保只在挂载时执行一次

  // 订阅状态更新
  useEffect(() => {
    console.log('========== 设置状态订阅 ==========');
    
    if (stateManagerRef.current) {
      const unsubscribe = stateManagerRef.current.subscribe(newState => {
        console.log('状态更新:', {
          角色数量: Object.keys(newState.characters.byId).length,
          玩家数量: Object.keys(newState.debate.players.byId).length,
          当前状态: newState.debate.currentState.status,
          主题: newState.debate.topic
        });
        setUnifiedState(newState);
      });

      return () => {
        console.log('清理状态订阅');
        unsubscribe();
      };
    }
  }, [stateManagerRef.current]); // 只在状态管理器变化时重新订阅

  // 监听配置变化并更新状态
  useEffect(() => {
    console.log('========== 配置变化检测 ==========');
    console.log('游戏配置:', gameConfig);
    console.log('角色状态:', characterState);
    
    if (stateManagerRef.current) {
      // 使用适配器创建新的统一状态
      const newState = StateAdapter.toUnified(gameConfig, characterState);
      
      // 更新状态管理器
      stateManagerRef.current.dispatch({
        type: 'BATCH_UPDATE',
        payload: newState
      });
    }
  }, [gameConfig, characterState]);

  // 处理辩论状态变更
  const handleDebateStateChange = (status: 'preparing' | 'ongoing' | 'paused' | 'finished') => {
    if (stateManagerRef.current && unifiedState) {
      stateManagerRef.current.dispatch({
        type: 'DEBATE_STATE_UPDATED',
        payload: {
          ...unifiedState.debate.currentState,
          status
        }
      });
    }
  };

  // 处理返回配置页面
  const handleBackToConfig = () => {
    if (unifiedState?.debate.currentState.status === 'ongoing') {
      const confirm = window.confirm('辩论正在进行中，确定要返回配置页面吗？');
      if (!confirm) return;
    }
    navigate('/game-config');
  };

  // 处理辩论控制
  const handleDebateControl = () => {
    const currentStatus = unifiedState?.debate.currentState.status;
    if (currentStatus === 'ongoing') {
      handleDebateStateChange('paused');
    } else {
      handleDebateStateChange('ongoing');
    }
  };

  // 获取模型信息的辅助函数
  const getModelInfo = (character: CharacterConfig) => {
    if (!character?.callConfig) return null;
    
    if (character.callConfig.type === 'dify') {
      return (
        <ModelBadge provider="dify">Dify工作流</ModelBadge>
      );
    }
    
    if (character.callConfig.direct) {
      const modelId = character.callConfig.direct.modelId;
      const model = modelState.models.find(m => m.id === modelId);
      const provider = character.callConfig.direct.provider;
      
      return (
        <>
        <ModelName>{`${model?.provider || character.callConfig.direct.model || modelId} · ${model?.model || character.callConfig.direct.model || modelId}`}</ModelName>
        </>
      );
    }
    
    return null;
  };

  // 如果还在加载中，显示加载状态
  if (isLoading || !unifiedState) {
    return (
      <Container>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%' 
        }}>
          正在加载辩论室...
        </div>
      </Container>
    );
  }

  // 获取当前辩论状态
  const { currentState, topic, players } = unifiedState.debate;
  const isDebating = currentState.status === 'ongoing';

  return (
    <Container>
      {/* 顶部工具栏 */}
      <TopBar>
        <ToolButton onClick={handleBackToConfig}>
          <ArrowLeftOutlined />返回配置
        </ToolButton>
        <Divider type="vertical" />
        <span>当前轮次: {currentState.round}/4</span>
        <Divider type="vertical" />
        <ToolButton onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? <BulbFilled /> : <BulbOutlined />}
          {isDarkMode ? '日间模式' : '夜间模式'}
        </ToolButton>
        <ToolButton onClick={() => stateManagerRef.current?.saveState()}>
          <SaveOutlined />保存会话
        </ToolButton>
        <ToolButton onClick={handleDebateControl}>
          {isDebating ? <StopOutlined /> : <PlayCircleOutlined />}
          {isDebating ? '结束辩论' : '开始辩论'}
        </ToolButton>
      </TopBar>

      {/* 主题信息区域 */}
      <TopicBar>
        <TopicTitle>{topic.title}</TopicTitle>
        <TopicInfo>
          <div>
            <span>辩论形式：{unifiedState.debate.rules.format === 'structured' ? '正反方辩论' : '自由辩论'}</span>
            <span style={{ margin: '0 16px' }}>|</span>
            <span>{topic.description}</span>
          </div>
        </TopicInfo>
      </TopicBar>

      {/* 主内容区域 */}
      <MainContent>
        <Resizable
          defaultSize={{ width: playerListWidth, height: '100%' }}
          minWidth={250}
          maxWidth="50%"
          enable={{ right: true }}
          onResizeStop={(e, direction, ref, d) => {
            setPlayerListWidth(playerListWidth + d.width);
          }}
        >
          <PlayerListSection>
            <div>
              {/* 调试信息 */}
              <div style={{ padding: '8px', fontSize: '12px', color: '#666', borderBottom: '1px solid #eee' }}>
                调试信息:
                <div>玩家数量: {Object.keys(players.byId).length}</div>
                <div>辩论形式: {unifiedState.debate.rules.format}</div>
                <div>角色数量: {Object.keys(unifiedState.characters.byId).length}</div>
                <div>当前状态: {currentState.status}</div>
              </div>
              
              {/* 玩家列表 */}
              {Object.values(players.byId).map(player => {
                const character = player.characterId ? 
                  unifiedState.characters.byId[player.characterId] : undefined;
                
                return (
                  <PlayerCard key={player.id}>
                    <PlayerAvatar 
                      src={character?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id}`}
                      alt={player.name}
                    />
                    <PlayerInfo>
                      <PlayerName>{player.name}</PlayerName>
                      <PlayerRole>
                        {unifiedState.debate.rules.format === 'structured' ? (
                          // 正反方辩论模式
                          <>
                            {player.role.includes('affirmative') ? '正方' : 
                             player.role.includes('negative') ? '反方' : 
                             player.role === 'judge' ? '裁判' : 
                             player.role === 'timekeeper' ? '计时员' : '观众'}
                            {player.role.includes('1') && ' - 一辩'}
                            {player.role.includes('2') && ' - 二辩'}
                            {player.role.includes('3') && ' - 三辩'}
                            {player.role.includes('4') && ' - 四辩'}
                          </>
                        ) : (
                          // 自由辩论模式，显示AI角色信息
                          character ? (
                            <CharacterInfo>
                              <CharacterName>{character.name}</CharacterName>
                              {character.description && (
                                <CharacterDescription>
                                  {character.description}
                                </CharacterDescription>
                              )}
                              {character?.persona && (
                                <CharacterPersona>
                                  {character.persona.background} · {character.persona.speakingStyle}
                                </CharacterPersona>
                              )}
                              <CharacterModel>
                                {getModelInfo(character)}
                              </CharacterModel>
                            </CharacterInfo>
                          ) : (
                            <div style={{ color: '#ff4d4f' }}>未分配角色 (ID: {player.characterId || 'none'})</div>
                          )
                        )}
                      </PlayerRole>
                    </PlayerInfo>
                  </PlayerCard>
                );
              })}
            </div>
          </PlayerListSection>
        </Resizable>

        <DebateContent>
          {/* 辩论内容展示区域 */}
          <div style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>
            {currentState.status === 'preparing' ? '准备开始辩论...' :
             currentState.status === 'paused' ? '辩论已暂停' :
             currentState.status === 'finished' ? '辩论已结束' :
             '辩论进行中...'}
          </div>
        </DebateContent>
      </MainContent>

      <StateDebugger />
    </Container>
  );
};

export default DebateRoom; 