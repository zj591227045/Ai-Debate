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
    display: block;
  }
`;

const JudgeTooltip = styled.div`
  display: none;
  position: absolute;
  bottom: calc(100% + 10px);
  right: -10px;
  width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 3px 6px -4px rgba(0,0,0,0.12), 0 6px 16px 0 rgba(0,0,0,0.08);
  padding: 16px;
  z-index: 1000;

  &:before {
    content: '';
    position: absolute;
    bottom: -6px;
    right: 20px;
    width: 12px;
    height: 12px;
    background: white;
    transform: rotate(45deg);
    box-shadow: 3px 3px 6px -3px rgba(0,0,0,0.12);
  }
`;

const JudgeTooltipContent = styled.div`
  .judge-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
  }

  .judge-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
  }

  .judge-basic-info {
    flex: 1;
  }

  .judge-name {
    font-size: 16px;
    font-weight: 500;
    color: #1f1f1f;
    margin-bottom: 4px;
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
    align-items: center;
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
    }
  }

  .judge-model {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
  }

  .judge-criteria {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;

    .criteria-title {
      font-weight: 500;
      color: #1f1f1f;
      margin-bottom: 8px;
    }

    .criteria-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 13px;
      color: #666;

      .dimension-name {
        min-width: 80px;
        color: #1f1f1f;
      }

      .weight {
        color: #1890ff;
      }

      .description {
        color: #8c8c8c;
        font-size: 12px;
      }
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

const PlayerCard = styled.div`
  padding: 0;
  margin-bottom: 2px;
  background: white;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &:hover {
    background: rgba(24, 144, 255, 0.02);
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
  const [playerListWidth, setPlayerListWidth] = useState(330);
  const [unifiedState, setUnifiedState] = useState<UnifiedState | null>(null);
  const [stateManager, setStateManager] = useState<ReturnType<typeof getStateManager>>(null);

  useEffect(() => {
    if (!gameConfig || !characterState) {
      navigate('/');
      return;
    }

    const manager = getStateManager(gameConfig, characterState);
    if (manager) {
      setStateManager(manager);
      setUnifiedState(manager.getState());
      setIsLoading(false);
      return manager.subscribe(newState => {
        setUnifiedState(newState);
      });
    } else {
      console.error('状态管理器初始化失败');
      navigate('/');
    }
  }, [gameConfig, characterState, navigate]);

  const getJudgeInfo = () => {
    if (!unifiedState?.debate.judge.characterId) return null;
    
    const judgeCharacter = unifiedState.characters.byId[unifiedState.debate.judge.characterId];
    if (!judgeCharacter) return null;

    return {
      id: judgeCharacter.id,
      name: judgeCharacter.name,
      avatar: judgeCharacter.avatar,
      description: judgeCharacter.description,
      persona: judgeCharacter.persona,
      callConfig: judgeCharacter.callConfig
    };
  };

  const judgeInfo = getJudgeInfo();

  // 处理辩论状态变更
  const handleDebateStateChange = (status: 'preparing' | 'ongoing' | 'paused' | 'finished') => {
    if (stateManager && unifiedState) {
      stateManager.dispatch({
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

  if (isLoading) {
    return <div>正在加载中...</div>;
  }

  if (!unifiedState || !stateManager) {
    return <div>状态初始化失败，请返回重试</div>;
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
        <ToolButton onClick={() => {
          if (stateManager) {
            stateManager.saveState();
          }
        }}>
          <SaveOutlined />保存会话
        </ToolButton>
        <ToolButton onClick={handleDebateControl}>
          {isDebating ? <StopOutlined /> : <PlayCircleOutlined />}
          {isDebating ? '结束辩论' : '开始辩论'}
        </ToolButton>
      </TopBar>

      {/* 主题信息区域 */}
      <TopicBar>
        <TopicSection>
          <TopicTitle>{topic.title}</TopicTitle>
          <TopicInfo>
            <div>
              <span>辩论形式：{unifiedState.debate.rules.format === 'structured' ? '正反方辩论' : '自由辩论'}</span>
              <span style={{ margin: '0 16px' }}>|</span>
              <span>{topic.description}</span>
            </div>
          </TopicInfo>
        </TopicSection>
        
        {judgeInfo && (
          <JudgeSection>
            <Tooltip 
              title={
                <div style={{ padding: '8px', maxWidth: '400px' }}>
                  {/* 基本信息 */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    marginBottom: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <img 
                      src={judgeInfo.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${judgeInfo.id}`}
                      alt={judgeInfo.name}
                      style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                    />
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>{judgeInfo.name}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>{judgeInfo.description}</div>
                    </div>
                  </div>

                  {/* 人设信息 */}
                  <div style={{ 
                    margin: '12px 0',
                    padding: '12px',
                    background: '#f9f9f9',
                    borderRadius: '6px'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#1f1f1f', fontWeight: 500, minWidth: '80px', display: 'inline-block' }}>说话风格</span>
                      <span style={{ color: '#666' }}>{judgeInfo.persona.speakingStyle}</span>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#1f1f1f', fontWeight: 500, minWidth: '80px', display: 'inline-block' }}>专业背景</span>
                      <span style={{ color: '#666' }}>{judgeInfo.persona.background}</span>
                    </div>
                    <div>
                      <span style={{ color: '#1f1f1f', fontWeight: 500, minWidth: '80px', display: 'inline-block' }}>性格特征</span>
                      <span style={{ color: '#666' }}>{judgeInfo.persona.personality.join('、')}</span>
                    </div>
                  </div>

                  {/* AI模型信息 */}
                  <div style={{ 
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <div style={{ fontWeight: 500, color: '#1f1f1f', marginBottom: '8px' }}>AI模型</div>
                    {getModelInfo(judgeInfo)}
                  </div>

                  {/* 评分规则 */}
                  <div style={{ 
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <div style={{ fontWeight: 500, color: '#1f1f1f', marginBottom: '8px' }}>评分规则</div>
                    <div style={{ 
                      fontSize: '13px',
                      color: '#666',
                      padding: '8px 12px',
                      background: '#f9f9f9',
                      borderRadius: '6px',
                      marginBottom: '12px',
                      lineHeight: '1.5'
                    }}>
                      {unifiedState.debate.judging.description || '暂无评分规则说明'}
                    </div>
                  </div>

                  {/* 评分标准 */}
                  <div style={{ 
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <div style={{ fontWeight: 500, color: '#1f1f1f', marginBottom: '8px' }}>评分标准</div>
                    {unifiedState.debate.judging.dimensions.map((dimension, index) => (
                      <div key={index} style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px',
                        fontSize: '13px'
                      }}>
                        <span style={{ minWidth: '80px', color: '#1f1f1f' }}>{dimension.name}</span>
                        <span style={{ color: '#1890ff' }}>{dimension.weight}分</span>
                        <span style={{ color: '#8c8c8c', fontSize: '12px' }}>{dimension.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              }
              placement="bottomRight"
              color="#fff"
              overlayStyle={{ maxWidth: '400px' }}
            >
              <JudgeAvatar>
                <img 
                  src={judgeInfo.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${judgeInfo.id}`}
                  alt={judgeInfo.name}
                />
              </JudgeAvatar>
            </Tooltip>
            <JudgeInfo>
              <JudgeName>{judgeInfo.name}</JudgeName>
              <JudgeRole>裁判</JudgeRole>
            </JudgeInfo>
          </JudgeSection>
        )}
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
            <DebugInfo>
              调试信息:
              <div>玩家数量: {Object.keys(players.byId).length}</div>
              <div>辩论形式: {unifiedState.debate.rules.format}</div>
              <div>角色数量: {Object.keys(unifiedState.characters.byId).length}</div>
              <div>当前状态: {currentState.status}</div>
            </DebugInfo>
            <PlayerListContainer>
              {Object.values(players.byId).map(player => {
                const character = player.characterId ? 
                  unifiedState.characters.byId[player.characterId] : undefined;
                
                return (
                  <PlayerCard key={player.id}>
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
                                  {getModelInfo(character)}
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