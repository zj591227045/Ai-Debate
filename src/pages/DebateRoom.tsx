import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
import type { RootState } from '../store';
import { useModel } from '../modules/model/context/ModelContext';
import type { CharacterConfig } from '../modules/character/types';
import { defaultTemplates, templateToCharacter } from '../modules/character/types/template';
import { StateDebugger } from '../components/debug/StateDebugger';
import { getStateManager, clearStateManager, updateStateManager } from '../store/unified';
import type { UnifiedState } from '../store/unified/types';
import { StateAdapter } from '../store/unified/adapters';
import { AITestPanel } from '../components/debug/AITestPanel';
import type { UnifiedPlayer, Speech } from '../types/adapters';
import { createTimestamp } from '../utils/timestamp';
import { DebugPanel } from '../components/debug/DebugPanel';
import { AIPlayerList } from '../components/debug/AIPlayerList';
import { SpeechList } from '../components/debate/SpeechList';
import { StateManager } from '../store/unified/StateManager';
import type { CharacterState } from '../types/character';
import type { CharacterStateStorage } from '../types/character';

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

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg-container);
`;

interface DebateState {
  topic: {
    title: string;
    background: string;
  };
  rules: {
    totalRounds: number;
  };
}

interface DebateProgress {
  currentRound: number;
}

interface DebateHistory {
  speeches: Speech[];
}

// 添加类型适配器
const adaptStateFromStorage = (parsedState: any): CharacterState => ({
  characters: Array.isArray(parsedState.characters) ? parsedState.characters : [],
  templates: Array.isArray(parsedState.templates) ? parsedState.templates : [],
  activeMode: parsedState.activeMode || 'direct',
  difyConfig: parsedState.difyConfig || {},
  directConfig: parsedState.directConfig || {}
});

export const DebateRoom: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const gameConfig = useSelector((state: RootState) => state.gameConfig);
  const { state: modelState } = useModel();
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [playerListWidth, setPlayerListWidth] = useState(330);
  const [unifiedState, setUnifiedState] = useState<UnifiedState | null>(null);
  const [stateManager, setStateManager] = useState<ReturnType<typeof getStateManager>>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<UnifiedPlayer | null>(null);
  const [debate, setDebate] = useState<DebateState>({
    topic: { title: '', background: '' },
    rules: { totalRounds: 0 }
  });
  const [progress, setProgress] = useState<DebateProgress>({
    currentRound: 1
  });
  const [history, setHistory] = useState<DebateHistory>({
    speeches: []
  });

  // 添加环境变量检查
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;

  // 添加调试相关状态
  const [showDebugger, setShowDebugger] = useState(false);

  const [streamingSpeech, setStreamingSpeech] = useState<{
    playerId: string;
    content: string;
  } | null>(null);

  // 添加 speeches 状态
  const [speeches, setSpeeches] = useState<Speech[]>([]);

  const stateManagerInstance = StateManager.getInstance();
  const [characters, setCharacters] = useState(() => {
    const state = stateManagerInstance.getState();
    return Object.values(state.characters.byId);
  });

  useEffect(() => {
    const unsubscribe = stateManagerInstance.subscribe((newState) => {
      setCharacters(Object.values(newState.characters.byId));
    });
    return () => unsubscribe();
  }, []);

  // 监听游戏配置和角色状态变化
  useEffect(() => {
    const initializeState = async () => {
      console.log('开始初始化状态...');
      setIsLoading(true);

      if (!gameConfig || !characters.length) {
        console.error('缺少必要的配置或角色状态');
        navigate('/');
        return;
      }

      try {
        // 修复 updateStateManager 调用
        const characterState: CharacterStateStorage = {
          characters: characters,
          templates: [],
          activeMode: 'direct',
          difyConfig: {
            serverUrl: '',
            apiKey: '',
            workflowId: '',
            parameters: {}
          },
          directConfig: {
            provider: 'openai',
            apiKey: '',
            model: 'gpt-3.5-turbo',
            parameters: {}
          }
        };
        updateStateManager(gameConfig, characterState);
        
        // 获取状态管理器实例
        const manager = getStateManager();
        if (!manager) {
          throw new Error('状态管理器初始化失败');
        }

        setStateManager(manager);
        const state = manager.getState();
        
        // 验证状态完整性
        if (!state.debate || !state.characters || Object.keys(state.characters.byId).length === 0) {
          throw new Error('状态不完整或角色数据为空');
        }

        setUnifiedState(state);
        
        // 订阅状态更新
        const unsubscribe = manager.subscribe(newState => {
          console.log('状态更新:', newState);
          setUnifiedState(newState);
        });

        // 加载完成
        setIsLoading(false);
        console.log('状态初始化完成');

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('初始化状态失败:', error);
        message.error('初始化失败，请返回重试');
        navigate('/');
      }
    };

    initializeState();
  }, [gameConfig, characters, navigate]);

  // 组件卸载时清理状态管理器
  useEffect(() => {
    return () => {
      if (stateManager) {
        stateManager.saveState();
      }
    };
  }, [stateManager]);

  // 监听当前发言者变化
  useEffect(() => {
    if (unifiedState?.debate.currentState.currentSpeaker) {
      const speakerId = unifiedState.debate.currentState.currentSpeaker;
      const speaker = unifiedState.debate.players.byId[speakerId];
      if (speaker) {
        setCurrentSpeaker({
          ...speaker,
          role: speaker.role as UnifiedPlayer['role']
        });
      }
    }
  }, [unifiedState?.debate.currentState.currentSpeaker]);

  const getJudgeInfo = () => {
    if (!unifiedState?.debate.judge?.characterId) return null;
    
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

  // 获取当前辩论状态
  const { currentState, topic, players } = unifiedState?.debate || {
    currentState: { round: 1, status: 'preparing' },
    topic: { title: '', description: '' },
    players: { byId: {} }
  };

  // 添加调试信息
  useEffect(() => {
    console.log('Debug Info:', {
      isDevelopment: process.env.NODE_ENV === 'development',
      currentSpeaker,
      isAI: currentSpeaker?.isAI,
      unifiedState: unifiedState?.debate.currentState,
      players: unifiedState?.debate.players.byId
    });
  }, [currentSpeaker, unifiedState]);

  const handleSpeechGenerated = (speech: Speech) => {
    // 更新流式输出状态，累积内容
    setStreamingSpeech(prev => {
      if (!prev || prev.playerId !== speech.playerId) {
        return {
          playerId: speech.playerId,
          content: speech.content
        };
      }
      return {
        playerId: speech.playerId,
        content: prev.content + speech.content
      };
    });
  };

  const handleSpeechComplete = (speech: Speech) => {
    // 清除流式输出状态
    setStreamingSpeech(null);
    
    // 更新历史记录
    stateManager?.dispatch({
      type: 'ADD_SPEECH',
      payload: speech
    });
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <Spin size="large" />
        <div>正在初始化辩论室...</div>
      </div>
    );
  }

  if (!unifiedState || !stateManager) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <Result
          status="error"
          title="初始化失败"
          subTitle="无法加载辩论配置，请返回重试"
          extra={[
            <Button type="primary" key="back" onClick={() => navigate('/')}>
              返回首页
            </Button>
          ]}
        />
      </div>
    );
  }

  const isDebating = currentState.status === 'ongoing';

  return (
    <Container>
      {/* 顶部工具栏 */}
      <TopBar>
        <ToolButton onClick={handleBackToConfig}>
          返回配置
        </ToolButton>
        <Divider type="vertical" />
        <span>当前轮次: {currentState.round}/4</span>
        <Divider type="vertical" />
        
        {/* 添加调试按钮 */}
        {process.env.NODE_ENV !== 'production' && (
          <>
            <ToolButton onClick={() => setShowDebugger(!showDebugger)}>
              {showDebugger ? <BulbFilled /> : <BulbOutlined />}
              {showDebugger ? '关闭调试' : '开启调试'}
            </ToolButton>
            <Divider type="vertical" />
          </>
        )}

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

        <ContentArea>
          {/* 发言记录列表 */}
          <SpeechList
            players={Object.values(unifiedState.debate.players.byId).map(player => ({
              ...player,
              role: player.role as UnifiedPlayer['role']
            }))}
            currentSpeakerId={currentState.currentSpeaker}
            speeches={speeches}
            streamingSpeech={streamingSpeech || undefined}
            onReference={(speechId: string) => {
              // 处理引用逻辑
            }}
            getReferencedSpeeches={(speechId: string) => {
              // 获取被引用的发言
              return [];
            }}
          />
        </ContentArea>
      </MainContent>

      <StateDebugger />

      {/* 调试面板 */}
      {isDevelopment && showDebugger && (
        <DebugPanel title="辩论室调试面板">
          <div>玩家数量: {Object.keys(players.byId).length}</div>
          <div>当前状态: {currentState.status}</div>
          <div>当前发言者：{currentSpeaker?.name}</div>
          <div>是否AI：{currentSpeaker?.isAI ? '是' : '否'}</div>
          
          {/* AI玩家列表 */}
          <AIPlayerList
            players={Object.values(players.byId).filter(p => p.isAI)}
            currentSpeakerId={currentSpeaker?.id}
            onSelectPlayer={(player) => {
              setCurrentSpeaker(player);
              if (stateManager) {
                stateManager.dispatch({
                  type: 'DEBATE_STATE_UPDATED',
                  payload: {
                    ...currentState,
                    currentSpeaker: player.id
                  }
                });
              }
            }}
            disabled={currentState.status !== 'ongoing'}
          />

          {/* AI测试面板 */}
          {currentSpeaker?.isAI && (
            <AITestPanel
              player={currentSpeaker}
              context={{
                topic: {
                  title: topic.title,
                  background: topic.description
                },
                currentRound: currentState.round,
                totalRounds: unifiedState.debate.rules.totalRounds,
                previousSpeeches: speeches
              }}
              onSpeechGenerated={handleSpeechGenerated}
              onError={(error) => {
                message.error('生成发言时出错：' + error.message);
              }}
            />
          )}
        </DebugPanel>
      )}
    </Container>
  );
};
