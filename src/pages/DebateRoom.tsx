import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { Tooltip, Divider, message, Spin, Result, Button } from 'antd';
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
import { useCharacter } from '../modules/character/context/CharacterContext';
import { useModel } from '../modules/model/context/ModelContext';
import type { CharacterConfig } from '../modules/character/types';
import { CharacterConfigService } from '../modules/storage/services/CharacterConfigService';
import { defaultTemplates, templateToCharacter } from '../modules/character/types/template';
import { StateDebugger } from '../components/debug/StateDebugger';
import { useStore } from '../modules/state';
import type { UnifiedPlayer, Speech, BaseDebateSpeech } from '../types/adapters';
import { createTimestamp } from '../utils/timestamp';
import { DebugPanel } from '../components/debug/DebugPanel';
import { AIPlayerList } from '../components/debug/AIPlayerList';
import { SpeechList } from '../components/debate/SpeechList';
import { DebateStatus, DebateProgress, DebateHistory, SessionAction, DebateState, SessionState } from '../modules/state/types/session';
import { AITestPanel } from '../components/debug/AITestPanel';

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
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TopicSection = styled.div`
  flex: 1;
`;

const JudgeSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 24px;
  border-left: 1px solid #e8e8e8;
`;

const JudgeAvatar = styled.div`
  position: relative;
  cursor: pointer;

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:hover .judge-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
`;

const JudgeTooltip = styled.div`
  opacity: 0;
  visibility: hidden;
  position: fixed;
  top: 80px;
  right: 20px;
  width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 3px 6px -4px rgba(0,0,0,0.12), 0 6px 16px 0 rgba(0,0,0,0.08);
  padding: 16px;
  z-index: 1000;
  transition: all 0.2s ease-in-out;
  transform: translateY(-10px);

  .judge-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  .judge-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;

    img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }
  }

  .judge-basic-info {
    flex: 1;
    overflow: hidden;
  }

  .judge-name {
    font-size: 16px;
    font-weight: 500;
    color: #1f1f1f;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .judge-description {
    font-size: 13px;
    color: #666;
    line-height: 1.5;
  }

  .judge-persona {
    margin: 12px 0;
    padding: 12px;
    background: #f9f9f9;
    border-radius: 6px;
  }

  .persona-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 13px;
    color: #666;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      color: #1f1f1f;
      font-weight: 500;
      min-width: 80px;
      flex-shrink: 0;
    }
  }

  .dimension-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 13px;

    .dimension-name {
      min-width: 80px;
      color: #1f1f1f;
      flex-shrink: 0;
    }

    .dimension-content {
      flex: 1;
      overflow: hidden;
    }
  }

  .section-title {
    font-weight: 500;
    color: #1f1f1f;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .section-content {
    font-size: 13px;
    color: #666;
    line-height: 1.5;
    max-height: 200px;
    overflow-y: auto;
    padding-right: 8px;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #e8e8e8;
      border-radius: 2px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }
`;

const JudgeInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const JudgeName = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #1f1f1f;
`;

const JudgeRole = styled.div`
  font-size: 12px;
  color: #666;
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
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PlayerListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #e8e8e8;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const DebugInfo = styled.div`
  padding: 8px;
  font-size: 12px;
  color: #666;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
`;

const PlayerCard = styled.div<{ active?: boolean }>`
  padding: 12px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.active ? props.theme.colors.primary + '1A' : 'transparent'};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background-color: ${props => props.theme.colors.background.hover};
  }
`;

const PlayerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
`;

const PlayerAvatar = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid #fff;
  background: #f5f5f5;
`;

const PlayerInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PlayerName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f1f1f;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PlayerRole = styled.div`
  font-size: 13px;
  color: #666;
  line-height: 1.6;
`;

const CharacterInfo = styled.div`
  margin-top: 4px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.01);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.04);
`;

const CharacterName = styled.div`
  color: #1890ff;
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;

  &:before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 18px;
    background: #1890ff;
    border-radius: 2px;
  }
`;

const CharacterDescription = styled.div`
  color: #666;
  font-size: 13px;
  line-height: 1.6;
  margin: 8px 0;
  padding-left: 12px;
  border-left: 2px solid rgba(24, 144, 255, 0.15);
`;

const CharacterPersona = styled.div`
  color: #8c8c8c;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  
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
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(0, 0, 0, 0.06);
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

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg-container);
`;

const PlayerListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background-color: ${props => props.theme.colors.background.secondary};
`;

export const DebateRoom: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: gameConfig } = useStore('gameConfig');
  const { state: session, setState: setSession } = useStore('session');
  const { state: modelState } = useStore('model');
  const { state: characterState } = useCharacter();
  
  const { 
    uiState: { isLoading, isDarkMode, playerListWidth },
    debateState
  } = session;

  // 添加调试相关状态
  const [showDebugger, setShowDebugger] = useState(false);

  // 获取当前玩家列表
  const currentPlayers = useMemo(() => gameConfig?.players || [], [gameConfig]);

  // 添加角色配置服务和状态
  const [characterConfigs, setCharacterConfigs] = useState<Record<string, CharacterConfig>>({});
  const characterService = useMemo(() => new CharacterConfigService(), []);

  // 修改获取裁判信息的函数
  const getJudgeInfo = () => {
    if (!gameConfig?.debate) {
      console.log('没有辩论配置');
      return null;
    }

    // 从 localStorage 中获取裁判信息
    const judgeConfig = localStorage.getItem('state_gameConfig');
    if (!judgeConfig) {
      console.log('没有找到裁判配置');
      return null;
    }

    try {
      const config = JSON.parse(judgeConfig);
      const selectedJudge = config.debate.judging.selectedJudge;
      if (!selectedJudge) {
        console.log('没有裁判配置');
        return null;
      }

      console.log('找到的裁判信息:', selectedJudge);

      // 从角色配置中获取更多信息
      const judgeCharacter = characterConfigs[selectedJudge.id];
      console.log('裁判角色配置:', judgeCharacter);
      
      return {
        id: selectedJudge.id,
        name: selectedJudge.name,
        avatar: selectedJudge.avatar,
        description: judgeCharacter?.description || '资深辩论裁判',
        persona: judgeCharacter?.persona || {
          background: '资深辩论裁判',
          speakingStyle: '专业严谨',
          personality: ['公正', '严谨', '专业']
        },
        callConfig: judgeCharacter?.callConfig
      };
    } catch (error) {
      console.error('解析裁判配置失败:', error);
      return null;
    }
  };

  // 添加对 judgeInfo 的调试日志
  const judgeInfo = getJudgeInfo();
  console.log('最终的裁判信息:', judgeInfo);

  // 修改加载角色配置的 effect
  useEffect(() => {
    const loadCharacterConfigs = async () => {
      try {
        console.log('开始加载角色配置...');
        const characters = await characterService.getActiveCharacters();
        console.log('获取到的角色列表:', characters);
        
        const configsMap = characters.reduce((acc, char) => {
          acc[char.id] = char;
          return acc;
        }, {} as Record<string, CharacterConfig>);
        
        console.log('转换后的角色配置Map:', configsMap);
        setCharacterConfigs(configsMap);
      } catch (error) {
        console.error('加载角色配置失败:', error);
        message.error('加载角色配置失败');
      }
    };

    loadCharacterConfigs();
  }, [characterService]);

  // 修改状态更新函数
  const handleResizeStop = (e: any, direction: any, ref: any, d: { width: number }) => {
    setSession({
      ...session,
      uiState: {
        ...session.uiState,
        playerListWidth: playerListWidth + d.width
      }
    });
  };

  // 修改玩家选择处理函数
  const handlePlayerSelect = (player: UnifiedPlayer) => {
    setSession({
      ...session,
      debateState: {
        ...session.debateState,
        currentSpeaker: player
      }
    });
  };

  // 修改AI测试面板的上下文
  const getAITestContext = () => ({
    topic: {
      title: gameConfig?.debate?.topic?.title || '',
      description: gameConfig?.debate?.topic?.description || ''
    },
    currentRound: session.debateState.progress.currentRound,
    totalRounds: gameConfig?.debate?.topic?.rounds || 0,
    previousSpeeches: session.debateState.history.speeches
  });

  // 添加初始化逻辑
  useEffect(() => {
    const initializeDebateRoom = async () => {
      try {
        if (!session.uiState) {
          setSession({
            ...session,
            uiState: {
              isLoading: true,
              isDarkMode: false,
              playerListWidth: 300
            }
          });
        } else {
          setSession({
            ...session,
            uiState: {
              ...session.uiState,
              isLoading: true
            }
          });
        }
        
        if (!gameConfig) {
          throw new Error('游戏配置不存在');
        }

        const initialState = {
          status: DebateStatus.NOT_STARTED,
          progress: {
            currentRound: 1,
            currentSpeaker: '',
            remainingTime: 0,
            completionPercentage: 0
          },
          history: {
            speeches: [],
            scores: []
          },
          players: [],
          currentSpeaker: null,
          streamingSpeech: null
        };

        setSession({
          ...session,
          debateState: initialState,
          uiState: {
            ...session.uiState,
            isLoading: false
          }
        });
      } catch (error) {
        console.error('初始化辩论室失败:', error);
        message.error('初始化辩论室失败');
        setSession({
          ...session,
          uiState: {
            ...session.uiState,
            isLoading: false
          }
        });
      }
    };

    initializeDebateRoom();
  }, [gameConfig, setSession]);

  // 处理辩论状态变更
  const handleDebateStateChange = (newStatus: DebateStatus) => {
    setSession({
      ...session,
      debateState: {
        ...session.debateState,
        status: newStatus
      }
    });
  };

  // 修改获取模型信息的辅助函数
  const getModelInfo = useCallback((characterId: string) => {
    const selectedCharacter = characterConfigs[characterId];
    if (!selectedCharacter?.callConfig?.direct) return null;
    
    const provider = selectedCharacter.callConfig.direct.provider;
    const model = selectedCharacter.callConfig.direct.model;
    
    return (
      <ModelName>
        {`${provider} · ${model}`}
      </ModelName>
    );
  }, [characterConfigs]);

  // 获取当前辩论状态
  const { currentState, topic, players } = gameConfig?.debate || {
    currentState: { round: 1, status: 'preparing' },
    topic: { title: '', description: '' },
    players: { byId: {} }
  };

  // 修改调试信息
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    console.log('Debug Info:', {
      currentSpeaker: session.debateState.currentSpeaker,
      isAI: session.debateState.currentSpeaker?.isAI,
      gameConfig: gameConfig?.debate?.currentState,
      players: session.debateState.players
    });
  }, [session.debateState.currentSpeaker, gameConfig, session.debateState.players]);

  const handleSpeechGenerated = (speech: Speech) => {
    setSession({
      ...session,
      debateState: {
        ...session.debateState,
        streamingSpeech: {
          playerId: speech.playerId,
          content: speech.content
        }
      }
    });
  };

  const handleSpeechComplete = (speech: Speech) => {
    const newSpeech: BaseDebateSpeech = {
      id: speech.id,
      playerId: speech.playerId,
      content: speech.content,
      timestamp: new Date().toISOString(),
      round: speech.round,
      references: speech.references || [],
      role: speech.role || 'assistant',
      type: speech.type || 'speech'
    };

    setSession({
      ...session,
      debateState: {
        ...session.debateState,
        streamingSpeech: null,
        history: {
          ...session.debateState.history,
          speeches: [...session.debateState.history.speeches, newSpeech]
        }
      }
    });
  };

  // 修改状态判断
  const isDebating = session.debateState.status === DebateStatus.IN_PROGRESS;

  // 修改错误处理
  const handleError = (error: Error) => {
    message.error('生成发言时出错：' + error.message);
  };

  // 如果 session 或 uiState 未定义，显示加载状态
  if (!session || !session.uiState) {
    return (
      <Container>
        <Spin tip="加载中...">
          <div style={{ padding: '50px' }} />
        </Spin>
      </Container>
    );
  }

  // 如果没有辩论配置，显示错误状态
  if (!gameConfig.debate) {
    return (
      <Container>
        <Result
          status="error"
          title="加载失败"
          subTitle="无法加载辩论配置"
          extra={[
            <Button type="primary" key="back" onClick={() => window.history.back()}>
              返回
            </Button>
          ]}
        />
      </Container>
    );
  }

  return (
    <Container>
      <TopBar>
        <ToolButton onClick={() => navigate('/game-config')}>
          <ArrowLeftOutlined />
          返回配置
        </ToolButton>
        <Divider type="vertical" />
        <ToolButton onClick={() => handleDebateStateChange(isDebating ? DebateStatus.PAUSED : DebateStatus.IN_PROGRESS)}>
          {session.debateState.status === DebateStatus.IN_PROGRESS ? (
            <>
              <PauseCircleOutlined />
              暂停辩论
            </>
          ) : (
            <>
              <PlayCircleOutlined />
              {session.debateState.status === DebateStatus.PAUSED ? '继续辩论' : '开始辩论'}
            </>
          )}
        </ToolButton>
        <ToolButton onClick={() => handleDebateStateChange(DebateStatus.COMPLETED)}>
          <StopOutlined />
          结束辩论
        </ToolButton>
        <ToolButton onClick={() => setSession({ ...session, uiState: { ...session.uiState, isDarkMode: !isDarkMode } })}>
          {isDarkMode ? <BulbFilled /> : <BulbOutlined />}
          {isDarkMode ? '浅色模式' : '深色模式'}
        </ToolButton>
      </TopBar>

      {/* 主题信息区域 */}
      <TopicBar>
        <TopicSection>
          <TopicTitle>{gameConfig?.debate?.topic?.title || '未设置辩题'}</TopicTitle>
          <TopicInfo>
            <div>{gameConfig?.debate?.topic?.description || '暂无描述'}</div>
          </TopicInfo>
        </TopicSection>

        {judgeInfo && (
          <JudgeSection>
            <JudgeAvatar>
              <img 
                src={judgeInfo.avatar} 
                alt={judgeInfo.name}
              />
              <JudgeTooltip className="judge-tooltip">
                <div className="judge-header">
                  <img src={judgeInfo.avatar} alt={judgeInfo.name} />
                  <div className="judge-basic-info">
                    <div className="judge-name">{judgeInfo.name}</div>
                    <div className="judge-description">{judgeInfo.description}</div>
                  </div>
                </div>

                <div className="judge-persona">
                  <div className="persona-item">
                    <span className="label">背景</span>
                    <span>{judgeInfo.persona.background}</span>
                  </div>
                  <div className="persona-item">
                    <span className="label">风格</span>
                    <span>{judgeInfo.persona.speakingStyle}</span>
                  </div>
                  <div className="persona-item">
                    <span className="label">性格</span>
                    <span>{judgeInfo.persona.personality.join('、')}</span>
                  </div>
                </div>

                {/* AI模型信息 */}
                <div style={{ 
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <div className="section-title">AI模型</div>
                  <div className="section-content">
                    {judgeInfo.callConfig?.direct && (
                      <>
                        <ModelBadge provider={judgeInfo.callConfig.direct.provider}>
                          {judgeInfo.callConfig.direct.provider}
                        </ModelBadge>
                        <ModelName>
                          {judgeInfo.callConfig.direct.model}
                        </ModelName>
                      </>
                    )}
                  </div>
                </div>

                {/* 评分规则 */}
                <div style={{ 
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <div className="section-title">评分规则</div>
                  <div className="section-content">
                    {gameConfig?.debate?.judging?.description || '暂无评分规则说明'}
                  </div>
                </div>

                {/* 评分标准 */}
                {gameConfig?.debate?.judging?.dimensions && (
                  <div style={{ 
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <div className="section-title">评分标准</div>
                    <div className="section-content">
                      {gameConfig.debate.judging.dimensions.map((dimension: {
                        name: string;
                        weight: number;
                        description: string;
                        criteria: string[];
                      }, index: number) => (
                        <div key={index} className="dimension-item">
                          <span className="dimension-name">{dimension.name}</span>
                          <div className="dimension-content">
                            <span style={{ color: '#1890ff', marginRight: '8px' }}>{dimension.weight}分</span>
                            <span style={{ color: '#8c8c8c' }}>{dimension.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </JudgeTooltip>
            </JudgeAvatar>
            <JudgeInfo>
              <JudgeName>{judgeInfo.name}</JudgeName>
              <div style={{ fontSize: '12px', color: '#666' }}>裁判</div>
            </JudgeInfo>
          </JudgeSection>
        )}
      </TopicBar>

      {/* 主内容区域 */}
      <MainContent>
        <Resizable
          size={{ width: playerListWidth, height: '100%' }}
          onResizeStop={handleResizeStop}
          enable={{ right: true }}
          minWidth={250}
          maxWidth={450}
        >
          <PlayerListSection>
            <PlayerListHeader>
              <div>参赛选手</div>
              <div>
                {currentPlayers.length}/4
              </div>
            </PlayerListHeader>
            <PlayerListContainer>
              {currentPlayers.map((player: UnifiedPlayer) => {
                const character = player.characterId ? characterConfigs[player.characterId] : undefined;
                
                return (
                  <PlayerCard 
                    key={player.id}
                    active={player.id === session.debateState.currentSpeaker?.id}
                  >
                    <PlayerHeader>
                      <PlayerAvatar 
                        src={character?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id}`}
                        alt={player.name}
                      />
                      <PlayerInfo>
                        <PlayerName>
                          {player.name}
                        </PlayerName>
                        <PlayerRole>
                          {gameConfig?.debate?.rules?.debateFormat === 'structured' ? (
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
                            character ? (
                              <CharacterInfo>
                                <CharacterName>{character.name}
                                  {player.isAI && (
                                    <span style={{ 
                                      fontSize: '12px',
                                      padding: '2px 8px',
                                      background: 'rgba(24, 144, 255, 0.1)',
                                      color: '#1890ff',
                                      borderRadius: '4px'
                                    }}>
                                      AI
                                    </span>
                                  )}
                                </CharacterName>

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
                                  {getModelInfo(character.id)}
                                </CharacterModel>
                              </CharacterInfo>
                            ) : (
                              <div style={{ 
                                color: '#ff4d4f',
                                fontSize: '13px',
                                padding: '8px 12px',
                                background: 'rgba(255, 77, 79, 0.1)',
                                borderRadius: '6px'
                              }}>
                                未分配角色 (ID: {player.characterId || 'none'})
                              </div>
                            )
                          )}
                        </PlayerRole>
                      </PlayerInfo>
                    </PlayerHeader>
                  </PlayerCard>
                );
              })}
            </PlayerListContainer>
          </PlayerListSection>
        </Resizable>

        <ContentArea>
          <SpeechList
            players={currentPlayers}
            currentSpeakerId={session.debateState.currentSpeaker?.id}
            speeches={session.debateState.history.speeches}
            streamingSpeech={session.debateState.streamingSpeech || undefined}
            onReference={(speechId: string) => {
              // 处理引用逻辑
            }}
            getReferencedSpeeches={(speechId: string) => {
              return [];
            }}
          />
        </ContentArea>
      </MainContent>

      {/* 添加状态调试器 */}
      <StateDebugger />

      {/* 调试面板 */}
      {process.env.NODE_ENV === 'development' && showDebugger && (
        <DebugPanel title="辩论室调试面板">
          <div>玩家数量: {currentPlayers.length}</div>
          <div>当前状态: {session.debateState.status}</div>
          <div>当前发言者：{session.debateState.currentSpeaker?.name}</div>
          <div>是否AI：{session.debateState.currentSpeaker?.isAI ? '是' : '否'}</div>
          
          {/* AI玩家列表 */}
          <AIPlayerList
            players={currentPlayers.filter((p: UnifiedPlayer) => p.isAI)}
            currentSpeakerId={session.debateState.currentSpeaker?.id}
            onSelectPlayer={handlePlayerSelect}
            disabled={session.debateState.status !== DebateStatus.IN_PROGRESS}
          />

          {/* AI测试面板 */}
          {session.debateState.currentSpeaker?.isAI && (
            <AITestPanel
              player={session.debateState.currentSpeaker}
              context={getAITestContext()}
              onSpeechGenerated={handleSpeechGenerated}
              onError={handleError}
            />
          )}
        </DebugPanel>
      )}
    </Container>
  );
};
