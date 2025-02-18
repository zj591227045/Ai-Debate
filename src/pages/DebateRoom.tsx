import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { Tooltip, Divider, message, Spin, Result, Button, Card, Space, Typography } from 'antd';
import { 
  BulbOutlined,
  BulbFilled
} from '@ant-design/icons';
import { Resizable } from 're-resizable';
import { useCharacter } from '../modules/character/context/CharacterContext';
import { useDebateFlow } from '../hooks/debate/useDebateFlow';
import { CharacterConfigService } from '../modules/storage/services/CharacterConfigService';
import { useStore } from '../modules/state';
import { useAIInteraction } from '../hooks/debate/useAIInteraction';
import { DebateFlowService } from '../modules/debate-flow/services/DebateFlowService';
import { ScoringSystem } from '../modules/scoring/services/ScoringSystem';
import { SpeechList } from '../components/debate/SpeechList';
import { DebateControl } from '../components/debate/DebateControl';
import { StateDebugger } from '../components/debug/StateDebugger';
import { ScoreDisplay } from '../components/debate/ScoreDisplay';
import { ScoreStatisticsDisplay } from '../components/debate/ScoreStatistics';
import { DebateErrorBoundary } from '../components/error/DebateErrorBoundary';
import type { CharacterConfig } from '../modules/character/types';
import type { DebateRole } from '../types/roles';
import type { 
  DebateProgress, 
  DebateHistory, 
  SessionAction, 
  DebateState, 
  SessionState 
} from '../modules/state/types/session';
import type { SpeechType, UnifiedPlayer, BaseDebateSpeech, BaseDebateScore } from '../types/adapters';
import type { Judge, DebateConfig } from '../types/interfaces';
import type { 
  DebateFlowConfig, 
  DebateRules,
  SpeechInput,
  DebateFlowState
} from '../modules/debate-flow/types/interfaces';
import { DebateStatus } from '../modules/debate-flow/types/interfaces';

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

// 状态映射函数
const mapToDebateStatus = (status: string): DebateStatus => {
  switch (status.toLowerCase()) {
    case 'preparing':
      return DebateStatus.PREPARING;
    case 'ongoing':
    case 'in_progress':
      return DebateStatus.ONGOING;
    case 'paused':
      return DebateStatus.PAUSED;
    case 'round_complete':
    case 'roundcomplete':
      return DebateStatus.ROUND_COMPLETE;
    case 'scoring':
      return DebateStatus.SCORING;
    case 'completed':
    case 'finished':
      return DebateStatus.COMPLETED;
    default:
      console.log('未知状态:', status, '使用默认状态 PREPARING');
      return DebateStatus.PREPARING;
  }
};

// 添加默认评分维度
const defaultDimensions = [
  {
    id: 'logic',
    name: '逻辑性',
    weight: 0.3,
    description: '论证的逻辑性和严谨性',
    criteria: ['论证清晰', '结构完整', '推理严谨']
  },
  {
    id: 'evidence',
    name: '论据支持',
    weight: 0.3,
    description: '论据的充分性和相关性',
    criteria: ['证据充分', '例证恰当', '数据准确']
  },
  {
    id: 'delivery',
    name: '表达能力',
    weight: 0.2,
    description: '表达的清晰性和感染力',
    criteria: ['语言流畅', '表达清晰', '感染力强']
  },
  {
    id: 'rebuttal',
    name: '反驳质量',
    weight: 0.2,
    description: '反驳的针对性和有效性',
    criteria: ['针对性强', '反驳有力', '立场一致']
  }
];

// 修改 UI 状态类型定义
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
    scores: BaseDebateScore[];
  };
  streamingSpeech: {
    playerId: string;
    content: string;
    type: 'speech' | 'innerThoughts' | 'system';
  } | null;
  players: UnifiedPlayer[];
}

// 初始 UI 状态
const initialUIState: UIState = {
  isLoading: false,
  isDarkMode: false,
  playerListWidth: 200,
  showDebugger: true,
  currentSpeaker: null,
  currentRound: 1,
  status: DebateStatus.PREPARING,
  history: {
    speeches: [],
    scores: []
  },
  streamingSpeech: null,
  players: []
};

// 在文件顶部添加类型定义
interface JudgeConfig {
  description?: string;
  dimensions?: any[];
  totalScore?: number;
  selectedJudge?: {
    id: string;
    name: string;
    avatar?: string;
  };
  scores?: BaseDebateScore[];
  currentRoundScores?: BaseDebateScore[];
  statistics?: any;
  rankings?: any[];
}

interface GameJudging {
  description: string;
  dimensions: any[];
  totalScore: number;
  selectedJudge?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export const DebateRoom: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: gameConfig } = useStore('gameConfig');
  const { state: modelState } = useStore('model');
  const { state: characterState } = useCharacter();
  
  // 获取裁判信息
  const getJudgeInfo = useCallback(() => {
    if (!gameConfig?.debate?.judging) {
      return null;
    }

    const judging = gameConfig.debate.judging as GameJudging;
    
    // 如果没有选定的裁判，返回系统裁判
    if (!judging.selectedJudge) {
      return {
        id: 'system_judge',
        name: '系统评委',
        description: '由AI驱动的智能评分系统'
      };
    }

    return {
      id: judging.selectedJudge.id,
      name: judging.selectedJudge.name,
      avatar: judging.selectedJudge.avatar,
      description: judging.description
    };
  }, [gameConfig?.debate?.judging]);

  // 使用 useMemo 缓存 judgeInfo
  const judgeInfo = useMemo(() => getJudgeInfo(), [getJudgeInfo]);

  // 使用新的 useDebateFlow hook
  const { 
    state: debateFlowState, 
    scores,
    error: debateError, 
    actions: debateActions 
  } = useDebateFlow(
    useMemo(() => {
      if (!gameConfig?.debate) {
        console.log('游戏配置不存在，返回undefined');
        return undefined;
      }
      
      const debate = gameConfig.debate;
      console.log('当前辩论配置:', debate);
      
      const rules: DebateRules = {
        format: debate.rules.debateFormat as 'structured' | 'free',
        rounds: debate.topic.rounds || 3,
        canSkipSpeaker: Boolean(debate.rules.advancedRules?.allowQuoting),
        requireInnerThoughts: Boolean(debate.rules.advancedRules?.requireResponse)
      };
      
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
        rules,
        judge: judgeInfo
      } as DebateFlowConfig;
    }, [gameConfig?.debate, gameConfig?.players, judgeInfo])
  );
  
  // 本地UI状态
  const [uiState, setUiState] = useState<UIState>(initialUIState);

  // 初始化评分系统
  const scoringSystem = useMemo(() => new ScoringSystem(), []);

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
        
        const initialPlayers = gameConfig.players || [];
        console.log('初始玩家列表:', initialPlayers);
        
        setUiState(prev => ({
          ...prev,
          isLoading: false,
          players: initialPlayers,
          status: DebateStatus.PREPARING,
          currentRound: 1,
          currentSpeaker: null,
          history: {
            speeches: [],
            scores: []
          },
          streamingSpeech: null,
          showDebugger: true
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
  }, [gameConfig?.debate?.topic.title]);

  // 修改状态同步
  useEffect(() => {
    if (!debateFlowState) {
      console.log('debateFlowState 为空，跳过状态同步');
      return;
    }

    setUiState((prev: UIState) => {
      const mappedStatus = mapToDebateStatus(debateFlowState.status);

      // 检查是否有流式内容
      const hasStreamingContent = 
        debateFlowState.currentSpeech?.status === 'streaming' &&
        debateFlowState.currentSpeech?.content;

      const newState: UIState = {
        ...prev,
        isDarkMode: prev.isDarkMode,
        playerListWidth: prev.playerListWidth,
        showDebugger: prev.showDebugger,
        currentSpeaker: debateFlowState.currentSpeaker ? {
          id: debateFlowState.currentSpeaker.id,
          name: debateFlowState.currentSpeaker.name,
          role: debateFlowState.currentSpeaker.role as DebateRole,
          isAI: debateFlowState.currentSpeaker.isAI
        } : null,
        currentRound: debateFlowState.currentRound,
        status: mappedStatus,
        history: {
          speeches: debateFlowState.speeches.map(speech => ({
            id: speech.id,
            playerId: speech.playerId,
            content: speech.content,
            type: speech.type,
            timestamp: new Date(speech.timestamp).toISOString(),
            round: speech.round,
            role: speech.role,
            references: []
          })),
          scores: prev.history.scores
        },
        streamingSpeech: hasStreamingContent && debateFlowState.currentSpeech ? {
          playerId: debateFlowState.currentSpeaker?.id || '',
          content: debateFlowState.currentSpeech.content,
          type: debateFlowState.currentSpeech.type || 'innerThoughts'
        } : null,
        players: prev.players
      };

      return newState;
    });
  }, [debateFlowState]);

  // 错误处理
  useEffect(() => {
    if (debateError) {
      message.error(debateError.message);
    }
  }, [debateError]);

  // 获取当前玩家列表
  // const currentPlayers = useMemo(() => gameConfig?.players || [], [gameConfig]);

  // 添加角色配置服务和状态
  const [characterConfigs, setCharacterConfigs] = useState<Record<string, CharacterConfig>>({});
  const characterService = useMemo(() => new CharacterConfigService(), []);

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

  // 处理辩论状态变更
  const handleDebateStateChange = async (newStatus: DebateStatus) => {
    console.log('辩论状态变更:', newStatus);
    
    if (newStatus === DebateStatus.ONGOING) {
      await debateActions.startDebate();
    }
    
    // 移除直接的 uiState 更新，让 useEffect 处理状态同步
  };

  // 添加处理下一位发言者的函数
  const handleNextSpeaker = async () => {
    try {
      if (debateActions) {
        await debateActions.skipCurrentSpeaker();
      }
    } catch (error) {
      console.error('切换发言者失败:', error);
      message.error('切换发言者失败');
    }
  };

  // 添加处理下一轮的函数
  const handleNextRound = async () => {
    try {
      if (debateActions) {
        await debateActions.startNextRound();
      }
    } catch (error) {
      console.error('进入下一轮失败:', error);
      message.error('进入下一轮失败');
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
  const { topic } = gameConfig?.debate || {
    topic: { title: '', description: '' }
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
      gameConfig: {
        status: uiState.status,
        currentRound: uiState.currentRound
      },
      players: uiState.players
    };
    
    // 只有当内容真正变化时才打印日志
    if (JSON.stringify(debugInfoRef.current) !== JSON.stringify(newDebugInfo)) {
      debugInfoRef.current = newDebugInfo;
      console.log('Debug Info:', newDebugInfo);
    }
  }, [uiState.currentSpeaker, uiState.status, uiState.currentRound, uiState.players]);

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
          content: speech.content,
          type: speech.type
      },
      players: prev.players
    }));
  };

  // 错误处理函数
  const handleError = useCallback((error: Error) => {
    message.error('操作出错：' + error.message);
  }, []);

  // 添加AI交互hook
  const {
    generateScore,
    isGenerating: isGeneratingScore
  } = useAIInteraction({
    onError: handleError
  });

  // 处理发言完成
  const handleSpeechComplete = async (speech: BaseDebateSpeech) => {
    try {
      // 更新当前演讲到历史记录
      setUiState(prev => ({
        ...prev,
        history: {
          ...prev.history,
          speeches: [...prev.history.speeches, speech]
        }
      }));

      const isLastSpeaker = uiState.players.length === uiState.currentRound;
      
      if (isLastSpeaker) {
        const roundSpeeches = uiState.history.speeches.filter(s => s.round === uiState.currentRound);
        const roundScores: BaseDebateScore[] = [];
        
        if (judgeInfo) {
          for (const roundSpeech of roundSpeeches) {
            try {
              const score = await generateScore({
                judge: {
                  ...judgeInfo,
                  role: 'judge',
                  isAI: true
                },
                speech: roundSpeech,
                scoringRules: defaultDimensions.map(dim => ({
                  dimension: {
                    id: dim.id,
                    name: dim.name,
                    weight: dim.weight,
                    description: dim.description,
                    criteria: dim.criteria
                  },
                  minScore: 0,
                  maxScore: 100,
                  guidelines: ['保持客观公正', '注重论证质量']
                }))
              });
              
              if (score) {
                roundScores.push(score);
              }
            } catch (error) {
              console.error(`生成评分失败: ${error}`);
              message.warning(`${roundSpeech.playerId} 的评分生成失败，将使用模拟评分`);
              
              // 使用 ScoringSystem 生成模拟评分
              const mockScore = scoringSystem.generateMockScore(roundSpeech);
              roundScores.push(mockScore);
            }
          }
          
          // 更新评分到 uiState
          setUiState(prev => ({
            ...prev,
            history: {
              ...prev.history,
              scores: [...prev.history.scores, ...roundScores]
            }
          }));

          // 通知评分完成
          message.success(`第 ${uiState.currentRound} 轮评分已完成`);
        }
      }

      // 更新当前发言人和轮次
      if (isLastSpeaker) {
        setUiState(prev => ({
          ...prev,
          currentRound: prev.currentRound + 1
        }));
        setUiState(prev => ({
          ...prev,
          currentSpeaker: uiState.players[0]
        }));
      } else {
        const nextSpeakerIndex = uiState.players.findIndex(p => p.id === uiState.currentSpeaker?.id) + 1;
        setUiState(prev => ({
          ...prev,
          currentSpeaker: uiState.players[nextSpeakerIndex]
        }));
      }
    } catch (error) {
      console.error('处理演讲完成时出错:', error);
      message.error('处理演讲完成时出错');
    }
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
  const isDebating = uiState.status === DebateStatus.ONGOING;

  // 渲染评分展示
  const renderScores = () => {
    if (!uiState.history.scores.length) return null;

    return (
      <div style={{ margin: '20px 0' }}>
        <ScoreStatisticsDisplay
          statistics={scoringSystem.calculateStatistics(uiState.history.scores)}
          rankings={scoringSystem.calculateRankings(uiState.history.scores, uiState.players)}
          getPlayerName={(playerId) => 
            uiState.players.find(p => p.id === playerId)?.name || playerId
          }
        />
      </div>
    );
  };

  // 渲染评分统计
  const renderScoreStatistics = () => {
    if (uiState.status !== DebateStatus.COMPLETED || !uiState.history.scores.length) return null;

    return (
      <ScoreStatisticsDisplay
        statistics={{
          dimensions: {
            logic: {
              average: 85,
              highest: 95,
              lowest: 75,
              distribution: { '80-89': 3, '90-100': 1 }
            }
          },
          overall: {
            average: 85,
            highest: 95,
            lowest: 75,
            distribution: { '80-89': 3, '90-100': 1 }
          }
        }}
        rankings={uiState.players
          .filter(p => p.role !== 'judge')
          .map((player, index) => ({
            playerId: player.id,
            totalScore: 85,
            averageScore: 85,
            dimensionScores: { logic: 85 },
            speechCount: 2,
            rank: index + 1
          }))}
        getPlayerName={id => uiState.players.find(p => p.id === id)?.name || id}
      />
    );
  };

  // 处理发言提交
  const handleSpeechSubmit = async (speech: SpeechInput) => {
    try {
      await debateActions.submitSpeech(speech);
    } catch (error) {
      console.error('发言提交失败:', error);
      message.error(`发言提交失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 处理跳过发言者
  const handleSkipSpeaker = async () => {
    try {
      await debateActions.skipCurrentSpeaker();
    } catch (error) {
      console.error('跳过发言者失败:', error);
      message.error(`跳过发言者失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 在组件内部添加 speechListProps 的定义
  const speechListProps = {
    players: uiState.players,
    currentSpeakerId: uiState.currentSpeaker?.id,
    speeches: uiState.history.speeches,
    streamingSpeech: uiState.streamingSpeech,
    onReference: (speechId: string) => {
      // 处理引用逻辑
      console.log('引用发言:', speechId);
    },
    getReferencedSpeeches: (speechId: string) => {
      // 获取被引用的发言
      return uiState.history.speeches.filter(s => 
        s.references?.includes(speechId)
      );
    }
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

  // 移除对 persona 和 callConfig 的引用
  const renderAIInfo = () => {
    const judge = getJudgeInfo();
    if (!judge) return null;

    return (
      <div className="ai-info">
        <h4>AI评分系统</h4>
        <p>使用先进的AI技术进行公正评分</p>
      </div>
    );
  };

  const [debateService, setDebateService] = useState<DebateFlowService | null>(null);
  const [localDebateState, setLocalDebateState] = useState<DebateFlowState | null>(null);

  return (
    <DebateErrorBoundary>
      <Container>
        <TopBar>
          <div className="room-info">
            <RoomTitle>{gameConfig?.debate?.topic?.title || '辩论室'}</RoomTitle>
            {/* 其他房间信息 */}
          </div>
          <div className="debate-controls">
            <DebateControl
              status={uiState.status}
              currentRound={uiState.currentRound}
              totalRounds={gameConfig.debate.topic.rounds}
              currentSpeaker={uiState.currentSpeaker}
              nextSpeaker={localDebateState?.nextSpeaker ? {
                id: localDebateState.nextSpeaker.id,
                name: localDebateState.nextSpeaker.name,
                role: localDebateState.nextSpeaker.role as DebateRole,
                isAI: localDebateState.nextSpeaker.isAI
              } : null}
              players={uiState.players}
              onStartScoring={handleDebateStateChange}
              onScoringComplete={handleSpeechComplete}
              onNextRound={handleNextRound}
              onNextSpeaker={handleNextSpeaker}
              scoringRules={defaultDimensions}
              judge={judgeInfo}
              speeches={uiState.history.speeches}
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

                  {/* AI模型信息 */}
                  <div style={{ 
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <div className="section-title">AI模型</div>
                    <div className="section-content">
                      {renderAIInfo()}
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
                  {uiState.players.length}/4
                </div>
              </PlayerListHeader>
              <PlayerListContainer>
                {uiState.players.map((player: UnifiedPlayer) => {
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
              players={uiState.players}
              currentSpeakerId={uiState.currentSpeaker?.id}
              speeches={uiState.history.speeches}
              streamingSpeech={uiState.streamingSpeech || undefined}
              onReference={(speechId: string) => {
                console.log('引用发言:', speechId);
              }}
              getReferencedSpeeches={(speechId: string) => {
                return uiState.history.speeches.filter(s => 
                  s.references?.includes(speechId)
                );
              }}
              characterConfigs={characterConfigs}
            />
            
            {/* 评分统计(辩论结束) */}
            {uiState.status === DebateStatus.COMPLETED && (
              <div style={{ margin: '20px 0', padding: '20px', background: '#fff', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '16px' }}>辩论总评</h3>
                <ScoreStatisticsDisplay
                  statistics={scoringSystem.calculateStatistics(uiState.history.scores)}
                  rankings={scoringSystem.calculateRankings(uiState.history.scores, uiState.players)}
                  getPlayerName={(playerId) => 
                    uiState.players.find(p => p.id === playerId)?.name || playerId
                  }
                />
              </div>
            )}
          </ContentArea>
        </MainContent>

        {/* 状态调试器 */}
        {uiState.showDebugger && (
          <StateDebugger
            state={{
              configState: {
                activeConfig: {
                  debate: {
                    topic: gameConfig.debate?.topic || { title: '', description: '', rounds: 3 }
                  }
                }
              },
              debateState: {
                status: uiState.status,
                progress: {
                  currentRound: uiState.currentRound
                },
                currentSpeaker: uiState.currentSpeaker,
                history: uiState.history
              },
              debate: {
                topic: gameConfig.debate?.topic || { title: '', description: '', rounds: 3 },
                rules: gameConfig.debate?.rules || {
                  debateFormat: 'free',
                  description: '',
                  advancedRules: {
                    speechLengthLimit: { min: 100, max: 1000 },
                    allowQuoting: true,
                    requireResponse: true,
                    allowStanceChange: false,
                    requireEvidence: true
                  }
                },
                judging: {
                  ...gameConfig.debate?.judging,
                  scores: uiState.history.scores,
                  currentRoundScores: uiState.history.scores.filter(
                    score => score.round === uiState.currentRound
                  ),
                  statistics: scoringSystem.calculateStatistics(uiState.history.scores),
                  rankings: scoringSystem.calculateRankings(uiState.history.scores, uiState.players)
                },
                status: uiState.status,
                currentRound: uiState.currentRound,
                currentSpeaker: uiState.currentSpeaker,
                speeches: uiState.history.speeches,
                scores: uiState.history.scores,
                format: gameConfig.debate?.rules?.debateFormat as 'structured' | 'free'
              },
              players: uiState.players
            }}
            onToggleDebugger={() => setUiState(prev => ({
              ...prev,
              showDebugger: !prev.showDebugger
            }))}
          />
        )}
      </Container>
    </DebateErrorBoundary>
  );
};
