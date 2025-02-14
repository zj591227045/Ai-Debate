import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { useDebateFlow } from '../modules/debate/hooks/useDebateFlow';
import type { CharacterConfig } from '../modules/character/types';
import { CharacterConfigService } from '../modules/storage/services/CharacterConfigService';
import { defaultTemplates, templateToCharacter } from '../modules/character/types/template';
import { useStore } from '../modules/state';
import type { UnifiedPlayer, BaseDebateSpeech } from '../types/adapters';
import type { DebateRole } from '../types/roles';
import { createTimestamp } from '../utils/timestamp';
import { SpeechList } from '../components/debate/SpeechList';
import { DebateStatus, DebateProgress, DebateHistory, SessionAction, DebateState, SessionState } from '../modules/state/types/session';
import type { DebateStatus as DebateFlowStatus } from '../modules/debate-flow/types/interfaces';
import { DebateControl } from '../components/debate/DebateControl';
import type { SpeechType } from '../types/adapters';

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
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;

  .debate-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    margin: 0 24px;
  }

  .room-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
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
  flex-direction: row;
  align-items: flex-start;
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
  display: flex;
  flex-direction: column;
  align-items: center;
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

const RoomTitle = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: var(--color-text-primary, #1f1f1f);
`;

// 添加UI状态类型定义
interface UIState {
  isLoading: boolean;
  isDarkMode: boolean;
  playerListWidth: number;
  showDebugger: boolean;
  currentSpeaker: UnifiedPlayer | null;
  currentRound: number;
  status: DebateStatus;
  history: {
    speeches: BaseDebateSpeech[];
    scores: any[];
  };
  streamingSpeech: {
    playerId: string;
    content: string;
  } | null;
  players: UnifiedPlayer[];
}

export const DebateRoom: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: gameConfig } = useStore('gameConfig');
  const { state: modelState } = useStore('model');
  const { state: characterState } = useCharacter();
  
  // 初始化useDebateFlow
  const { state: debateFlowState, error: debateFlowError, actions: debateFlowActions } = useDebateFlow(
    useMemo(() => {
      if (!gameConfig?.debate) {
        console.log('游戏配置不存在，返回undefined');
        return undefined;
      }
      
      const debate = gameConfig.debate;
      console.log('当前辩论配置:', debate);
      
      return {
        topic: {
          title: debate.topic.title || '',
          description: debate.topic.description || '',
          rounds: debate.topic.rounds || 3
        },
        players: (gameConfig.players || []).map(player => ({
          id: player.id,
          name: player.name,
          isAI: player.isAI,
          role: player.role,
          characterConfig: player.characterId ? {
            id: player.characterId,
            personality: player.personality || '',
            speakingStyle: player.speakingStyle || '',
            background: player.background || '',
            values: player.values ? [player.values] : [],
            argumentationStyle: player.argumentationStyle || ''
          } : undefined
        })),
        rules: {
          debateFormat: debate.rules.debateFormat as 'structured' | 'free',
          canSkipSpeaker: Boolean(debate.rules.advancedRules?.allowQuoting),
          requireInnerThoughts: Boolean(debate.rules.advancedRules?.requireResponse)
        }
      };
    }, [gameConfig?.debate, gameConfig?.players])
  );
  
  // 本地UI状态
  const [uiState, setUiState] = useState<UIState>({
    isLoading: true,
    isDarkMode: false,
    playerListWidth: 300,
    showDebugger: false,
    currentSpeaker: null,
    currentRound: 1,
    status: DebateStatus.NOT_STARTED,
    history: {
      speeches: [],
      scores: []
    },
    streamingSpeech: null,
    players: gameConfig?.players || []
  });

  // 添加初始化逻辑
  useEffect(() => {
    let isInitialized = false;

    const initializeDebateRoom = async () => {
      if (isInitialized) {
        console.log('辩论室已经初始化，跳过');
        return;
      }
      
      try {
        if (!gameConfig?.debate) {
          console.error('游戏配置不存在');
          throw new Error('游戏配置不存在');
        }

        console.log('开始初始化辩论室...');
        
        // 使用gameConfig中的玩家列表初始化
        const initialPlayers = gameConfig.players || [];
        console.log('初始玩家列表:', initialPlayers);
        
        setUiState(prev => ({
          ...prev,
          isLoading: false,
          players: initialPlayers,
          status: DebateStatus.NOT_STARTED,  // 确保初始状态为未开始
          currentRound: 1,
          currentSpeaker: null,
          history: {
            speeches: [],
            scores: []
          },
          streamingSpeech: null,
          showDebugger: true  // 开启调试器以便观察状态
        }));
        
        isInitialized = true;
        console.log('辩论室初始化完成');
        
      } catch (error) {
        console.error('初始化辩论室失败:', error);
        message.error('初始化辩论室失败');
        setUiState(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    };

    initializeDebateRoom();

    return () => {
      isInitialized = true;
    };
  }, [gameConfig?.debate?.topic.title]); // 只在辩题改变时重新初始化

  // 同步debateFlowState到uiState
  useEffect(() => {
    if (!debateFlowState) return;

    const currentSpeaker = debateFlowState.currentSpeaker;
    setUiState(prev => ({
      ...prev,
      currentSpeaker: currentSpeaker ? {
        id: currentSpeaker.id,
        name: currentSpeaker.name,
        role: currentSpeaker.role as DebateRole,
        isAI: currentSpeaker.isAI
      } as UnifiedPlayer : null,
      currentRound: debateFlowState.currentRound,
      status: mapDebateFlowStatus(debateFlowState.status),
      history: {
        speeches: debateFlowState.speeches.map(speech => ({
          id: speech.id,
          playerId: speech.playerId,
          content: speech.content,
          timestamp: typeof speech.timestamp === 'number' ? 
                    new Date(speech.timestamp).toISOString() : 
                    speech.timestamp,
          round: speech.round,
          references: [],
          role: speech.role === 'system' ? 'assistant' : speech.role || 'assistant',
          type: speech.type === 'innerThoughts' ? 'innerThought' : 'speech'
        } as BaseDebateSpeech)),
        scores: []
      }
    }));
  }, [debateFlowState]);

  // 处理错误
  useEffect(() => {
    if (debateFlowError) {
      message.error(`辩论流程错误: ${debateFlowError.message}`);
    }
  }, [debateFlowError]);

  // 获取当前玩家列表
  const currentPlayers = useMemo(() => gameConfig?.players || [], [gameConfig]);

  // 添加角色配置服务和状态
  const [characterConfigs, setCharacterConfigs] = useState<Record<string, CharacterConfig>>({});
  const characterService = useMemo(() => new CharacterConfigService(), []);

  // 修改获取裁判信息的函数
  const getJudgeInfo = useCallback(() => {
    if (!gameConfig?.debate) {
      return null;
    }

    // 从 localStorage 中获取裁判信息
    const judgeConfig = localStorage.getItem('state_gameConfig');
    if (!judgeConfig) {
      return null;
    }

    try {
      const config = JSON.parse(judgeConfig);
      const selectedJudge = config.debate.judging.selectedJudge;
      if (!selectedJudge) {
        return null;
      }

      // 从角色配置中获取更多信息
      const judgeCharacter = characterConfigs[selectedJudge.id];
      
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
  }, [gameConfig?.debate, characterConfigs]);

  // 使用 useMemo 缓存 judgeInfo
  const judgeInfo = useMemo(() => getJudgeInfo(), [getJudgeInfo]);

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
    setUiState(prev => ({
      isLoading: prev.isLoading,
      isDarkMode: prev.isDarkMode,
      playerListWidth: prev.playerListWidth + d.width,
      showDebugger: prev.showDebugger,
      currentSpeaker: prev.currentSpeaker,
      currentRound: prev.currentRound,
      status: prev.status,
      history: prev.history,
      streamingSpeech: prev.streamingSpeech,
      players: prev.players
    }));
  };

  // 修改玩家选择处理函数
  const handlePlayerSelect = (player: UnifiedPlayer) => {
    setUiState(prev => ({
      isLoading: prev.isLoading,
      isDarkMode: prev.isDarkMode,
      playerListWidth: prev.playerListWidth,
      showDebugger: prev.showDebugger,
      currentSpeaker: player,
      currentRound: prev.currentRound,
      status: prev.status,
      history: prev.history,
      streamingSpeech: prev.streamingSpeech,
      players: prev.players
    }));
  };

  // 修改AI测试面板的上下文
  const getAITestContext = () => ({
    topic: {
      title: gameConfig?.debate?.topic?.title || '',
      description: gameConfig?.debate?.topic?.description || ''
    },
    currentRound: uiState.currentRound,
    totalRounds: gameConfig?.debate?.topic?.rounds || 0,
    previousSpeeches: uiState.history.speeches
  });

  // 添加状态映射函数
  const mapDebateFlowStatus = (status?: DebateFlowStatus): DebateStatus => {
    switch (status) {
      case 'ongoing':
        return DebateStatus.IN_PROGRESS;
      case 'paused':
        return DebateStatus.PAUSED;
      case 'completed':
        return DebateStatus.COMPLETED;
      case 'preparing':
      default:
        return DebateStatus.NOT_STARTED;
    }
  };

  // 处理辩论状态变更
  const handleDebateStateChange = async (newStatus: DebateStatus) => {
    try {
      if (!debateFlowActions) {
        console.error('辩论流程未初始化');
        throw new Error('辩论流程未初始化');
      }

      console.log('状态变更:', {
        当前状态: uiState.status,
        目标状态: newStatus,
        debateFlowState
      });

      switch (newStatus) {
        case DebateStatus.IN_PROGRESS:
          if (uiState.status === DebateStatus.NOT_STARTED) {
            console.log('开始辩论流程...');
            await debateFlowActions.startDebate();
            message.success('辩论开始');
          } else if (uiState.status === DebateStatus.PAUSED) {
            console.log('恢复辩论流程...');
            await debateFlowActions.resumeDebate();
            message.success('辩论继续');
          }
          break;
        case DebateStatus.PAUSED:
          console.log('暂停辩论流程...');
          await debateFlowActions.pauseDebate();
          message.success('辩论已暂停');
          break;
        case DebateStatus.COMPLETED:
          console.log('结束辩论流程...');
          await debateFlowActions.endDebate();
          message.success('辩论已结束');
          break;
      }

      setUiState(prev => ({
        ...prev,
        status: newStatus
      }));

    } catch (error) {
      console.error('状态变更失败:', error);
      message.error(`状态变更失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
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

  // 修改调试信息，使用 useRef 来减少不必要的重渲染
  const debugInfoRef = useRef({
    currentSpeaker: null as UnifiedPlayer | null,
    isAI: false,
    gameConfig: null as any,
    players: [] as UnifiedPlayer[]
  });

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const newDebugInfo = {
      currentSpeaker: uiState.currentSpeaker,
      isAI: Boolean(uiState.currentSpeaker?.isAI),
      gameConfig: gameConfig?.debate?.currentState,
      players: uiState.players
    };
    
    // 只有当内容真正变化时才打印日志
    if (JSON.stringify(debugInfoRef.current) !== JSON.stringify(newDebugInfo)) {
      debugInfoRef.current = newDebugInfo;
      console.log('Debug Info:', newDebugInfo);
    }
  }, [uiState.currentSpeaker, gameConfig, uiState.players]);

  // 处理发言生成
  const handleSpeechGenerated = (speech: BaseDebateSpeech) => {
    setUiState(prev => ({
      isLoading: prev.isLoading,
      isDarkMode: prev.isDarkMode,
      playerListWidth: prev.playerListWidth,
      showDebugger: prev.showDebugger,
      currentSpeaker: prev.currentSpeaker,
      currentRound: prev.currentRound,
      status: prev.status,
      history: prev.history,
        streamingSpeech: {
          playerId: speech.playerId,
          content: speech.content
      },
      players: prev.players
    }));
  };

  // 处理发言完成
  const handleSpeechComplete = (speech: BaseDebateSpeech) => {
    setUiState(prev => ({
      isLoading: prev.isLoading,
      isDarkMode: prev.isDarkMode,
      playerListWidth: prev.playerListWidth,
      showDebugger: prev.showDebugger,
      currentSpeaker: prev.currentSpeaker,
      currentRound: prev.currentRound,
      status: prev.status,
      history: {
        speeches: prev.history.speeches.concat(speech),
        scores: prev.history.scores
      },
      streamingSpeech: null,
      players: prev.players
    }));
  };

  // 修改深色模式切换
  const handleThemeChange = () => {
    setUiState(prev => ({
      isLoading: prev.isLoading,
      isDarkMode: !prev.isDarkMode,
      playerListWidth: prev.playerListWidth,
      showDebugger: prev.showDebugger,
      currentSpeaker: prev.currentSpeaker,
      currentRound: prev.currentRound,
      status: prev.status,
      history: prev.history,
      streamingSpeech: prev.streamingSpeech,
      players: prev.players
    }));
  };

  // 修改状态判断
  const isDebating = uiState.status === DebateStatus.IN_PROGRESS;

  // 修改错误处理
  const handleError = (error: Error) => {
    message.error('生成发言时出错：' + error.message);
  };

  // 如果 uiState 未定义，显示加载状态
  if (!uiState) {
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
        <div className="room-info">
          <RoomTitle>{gameConfig?.debate?.topic?.title || '辩论室'}</RoomTitle>
          {/* 其他房间信息 */}
        </div>
        <div className="debate-controls">
          <DebateControl
            status={mapDebateStatus(uiState.status)}
            roundInfo={{
              currentRound: uiState.currentRound,
              totalRounds: gameConfig?.debate?.topic?.rounds || 3,
              currentSpeaker: uiState.currentSpeaker?.id,
              nextSpeaker: debateFlowState?.nextSpeaker?.id,
              speakingOrder: debateFlowState?.speakingOrder?.speakers?.map(s => s.player.id) || []
            }}
            onStart={() => handleDebateStateChange(DebateStatus.IN_PROGRESS)}
            onPause={() => handleDebateStateChange(DebateStatus.PAUSED)}
            onResume={() => handleDebateStateChange(DebateStatus.IN_PROGRESS)}
            onEnd={() => handleDebateStateChange(DebateStatus.COMPLETED)}
            onNextRound={() => {
              message.info('正在进入下一轮...');
              if (debateFlowActions?.submitSpeech) {
                debateFlowActions.submitSpeech({
                  playerId: 'system',
                  content: '进入下一轮',
                  type: 'speech',
                  references: [],
                  role: 'system',
                  timestamp: new Date().toISOString(),
                  round: uiState.currentRound,
                  id: `system-${Date.now()}`
                });
              }
            }}
            onNextSpeaker={() => {
              message.info('正在切换下一位发言者...');
              if (debateFlowActions?.submitSpeech) {
                debateFlowActions.submitSpeech({
                  playerId: 'system',
                  content: '切换下一位发言者',
                  type: 'system',
                  references: [],
                  role: 'system',
                  timestamp: new Date().toISOString(),
                  round: uiState.currentRound,
                  id: `system-${Date.now()}`
                });
              }
            }}
            getPlayerName={(playerId) => {
              const player = currentPlayers.find(p => p.id === playerId);
              return player?.name || '未知选手';
            }}
          />
        </div>
        <ToolButton onClick={handleThemeChange}>
          {uiState.isDarkMode ? <BulbFilled /> : <BulbOutlined />}
          {uiState.isDarkMode ? '浅色模式' : '深色模式'}
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
          size={{ width: uiState.playerListWidth, height: '100%' }}
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
                    active={player.id === uiState.currentSpeaker?.id}
                  >
                    <PlayerHeader>
                      <div>
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
                              <>
                                {player.role === 'free' ? '自由辩手' : 
                                 player.role === 'judge' ? '裁判' : 
                                 player.role === 'timekeeper' ? '计时员' : 
                                 player.role === 'unassigned' ? '未分配' : '观众'}
                              </>
                            )}
                          </PlayerRole>
                        </PlayerInfo>
                      </div>
                      {character && (
                              <CharacterInfo>
                          <CharacterName>
                            {character.name}
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
                      )}
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
            currentSpeakerId={uiState.currentSpeaker?.id}
            speeches={uiState.history.speeches}
            streamingSpeech={uiState.streamingSpeech || undefined}
            onReference={(speechId: string) => {
              // 处理引用逻辑
            }}
            getReferencedSpeeches={(speechId: string) => {
              return [];
            }}
          />
        </ContentArea>
      </MainContent>
    </Container>
  );
};

// 添加状态映射函数
const mapDebateStatus = (status: DebateStatus): 'preparing' | 'ongoing' | 'paused' | 'finished' => {
  switch (status) {
    case DebateStatus.IN_PROGRESS:
      return 'ongoing';
    case DebateStatus.PAUSED:
      return 'paused';
    case DebateStatus.COMPLETED:
      return 'finished';
    case DebateStatus.NOT_STARTED:
    default:
      return 'preparing';
  }
};
