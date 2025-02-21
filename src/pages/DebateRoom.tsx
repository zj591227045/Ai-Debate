import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { ThemeProvider } from '@emotion/react';
import theme from '../styles/theme';
import { Tooltip, Divider, message, Spin, Result, Button, Card, Space, Typography, Modal, Dropdown } from 'antd';
import { 
  BulbOutlined,
  BulbFilled,
  RollbackOutlined,
  DownloadOutlined,
  FileOutlined,
  PictureOutlined
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
import type { GameConfigState } from '../modules/state/types/gameConfig';
import type { ScoringDimension } from '../modules/debate-flow/types/interfaces';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ExportService } from '../modules/debate/services/ExportService';

// 主容器
const Container = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${props => props.isDarkMode ? '#1f1f1f' : 'rgb(244, 245, 245)'};
  color: ${props => props.isDarkMode ? '#ffffff' : 'rgb(31, 31, 31)'};
`;

// 顶部工具栏
const TopBar = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
  border-bottom: 1px solid ${props => props.isDarkMode ? '#3d3d3d' : '#f0f0f0'};
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

const ToolButton = styled.button<{ isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: ${props => props.isDarkMode ? '#a6a6a6' : '#666'};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;

  &:hover {
    background: ${props => props.isDarkMode ? '#3d3d3d' : '#f5f5f5'};
    color: ${props => props.isDarkMode ? '#1890ff' : '#1890ff'};
  }

  .anticon {
    margin-right: 4px;
  }
`;

// 在TopBar的styled-components定义后添加
const BackButton = styled(ToolButton)<{ isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 12px;
`;

// 主题信息区域
const TopicBar = styled.div<{ isDarkMode?: boolean }>`
  padding: 16px;
  background: ${props => props.isDarkMode ? '#2d2d2d' : 'white'};
  border-bottom: 1px solid ${props => props.isDarkMode ? '#3d3d3d' : '#e8e8e8'};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TopicSection = styled.div<{ isDarkMode?: boolean }>`
  flex: 1;
`;

const JudgeSection = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 24px;
  border-left: 1px solid ${props => props.isDarkMode ? '#3d3d3d' : '#e8e8e8'};
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

const JudgeTooltip = styled.div<{ isDarkMode?: boolean }>`
  opacity: 0;
  visibility: hidden;
  position: fixed;
  top: 80px;
  right: 20px;
  width: 320px;
  background: ${props => props.isDarkMode ? '#2d2d2d' : 'white'};
  border-radius: 8px;
  box-shadow: 0 3px 6px -4px rgba(0,0,0,0.24), 0 6px 16px 0 rgba(0,0,0,0.16);
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
    border-bottom: 1px solid ${props => props.isDarkMode ? '#3d3d3d' : '#f0f0f0'};

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
    color: ${props => props.isDarkMode ? '#ffffff' : '#1f1f1f'};
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .judge-description {
    font-size: 13px;
    color: ${props => props.isDarkMode ? '#a6a6a6' : '#666'};
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
    color: ${props => props.isDarkMode ? '#ffffff' : '#1f1f1f'};
    margin-bottom: 8px;
    font-size: 14px;
  }

  .section-content {
    font-size: 13px;
    color: ${props => props.isDarkMode ? '#a6a6a6' : '#666'};
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

const TopicTitle = styled.h2<{ isDarkMode?: boolean }>`
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 500;
  color: ${props => props.isDarkMode ? '#ffffff' : 'inherit'};
`;

const TopicInfo = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${props => props.isDarkMode ? '#a6a6a6' : '#666'};
  font-size: 14px;
`;

// 主内容区域
const MainContent = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex: 1;
  overflow: hidden;
  background: ${props => props.isDarkMode ? '#1f1f1f' : 'white'};
`;

// 左侧选手列表
const PlayerListSection = styled.div<{ isDarkMode?: boolean }>`
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#f5f5f5'};
  border-right: 1px solid ${props => props.isDarkMode ? '#3d3d3d' : '#e8e8e8'};
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PlayerListContainer = styled.div<{ isDarkMode?: boolean }>`
  flex: 1;
  overflow-y: auto;
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#f5f5f5'};
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.isDarkMode ? '#4d4d4d' : '#e8e8e8'};
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

const PlayerCard = styled.div<{ active?: boolean; isDarkMode?: boolean }>`
  padding: 12px;
  border-bottom: 1px solid ${props => props.isDarkMode ? '#3d3d3d' : '#e8e8e8'};
  background-color: ${props => {
    if (props.isDarkMode) {
      return props.active ? 'rgba(65, 87, 255, 0.2)' : '#2d2d2d';
    }
    return props.active ? 'rgba(65, 87, 255, 0.1)' : '#ffffff';
  }};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.isDarkMode ? 'rgba(65, 87, 255, 0.15)' : 'rgba(65, 87, 255, 0.05)'};
  }
`;

const PlayerHeader = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
`;

const PlayerAvatar = styled.img<{ isDarkMode: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, ${props => props.isDarkMode ? '0.2' : '0.08'});
  border: 2px solid ${props => props.isDarkMode ? '#3d3d3d' : '#ffffff'};
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#f5f5f5'};
`;

const PlayerInfo = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: ${props => props.isDarkMode ? '#ffffff' : '#1f1f1f'};
`;

const PlayerName = styled.div<{ isDarkMode?: boolean }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.isDarkMode ? '#ffffff' : '#1f1f1f'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PlayerRole = styled.div<{ isDarkMode?: boolean }>`
  font-size: 13px;
  color: ${props => props.isDarkMode ? '#a6a6a6' : '#666666'};
  line-height: 1.6;
`;

const CharacterInfo = styled.div<{ isDarkMode?: boolean }>`
  margin-top: 4px;
  padding: 12px;
  background: ${props => props.isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.01)'};
  border-radius: 8px;
  border: 1px solid ${props => props.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)'};
`;

const CharacterName = styled.div<{ isDarkMode?: boolean }>`
  color: ${props => props.isDarkMode ? '#87a9ff' : '#1890ff'};
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
    background: ${props => props.isDarkMode ? '#87a9ff' : '#1890ff'};
    border-radius: 2px;
  }
`;

const CharacterDescription = styled.div<{ isDarkMode?: boolean }>`
  color: ${props => props.isDarkMode ? '#a6a6a6' : '#666666'};
  font-size: 13px;
  line-height: 1.6;
  margin: 8px 0;
  padding-left: 12px;
  border-left: 2px solid ${props => props.isDarkMode ? 'rgba(135, 169, 255, 0.3)' : 'rgba(24, 144, 255, 0.15)'};
`;

const CharacterPersona = styled.div<{ isDarkMode?: boolean }>`
  color: ${props => props.isDarkMode ? '#8c8c8c' : '#8c8c8c'};
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
    background: ${props => props.isDarkMode ? '#4d4d4d' : '#d9d9d9'};
    border-radius: 50%;
  }
`;

const CharacterModel = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed ${props => props.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'};
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

const ContentArea = styled.div<{ isDarkMode?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${props => props.isDarkMode ? '#1f1f1f' : 'var(--color-bg-container)'};
`;

const PlayerListHeader = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: ${props => props.isDarkMode ? 'rgba(65, 87, 255, 0.15)' : 'linear-gradient(135deg, rgba(65, 87, 255, 0.1), rgba(65, 87, 255, 0.05))'};
  border-bottom: 1px solid ${props => props.isDarkMode ? 'rgba(65, 87, 255, 0.2)' : 'rgba(65, 87, 255, 0.1)'};
  
  .title {
    font-size: 16px;
    font-weight: 500;
    color: ${props => props.isDarkMode ? '#ffffff' : '#1f1f1f'};
    display: flex;
    align-items: center;
    gap: 8px;
    
  }
  
  .count {
    padding: 4px 12px;
    background: ${props => props.isDarkMode ? 'rgba(65, 87, 255, 0.2)' : 'rgba(65, 87, 255, 0.1)'};
    border-radius: 12px;
    color: ${props => props.isDarkMode ? '#87a9ff' : '#4157ff'};
    font-size: 14px;
    font-weight: 500;
  }
`;

const RoomTitle = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: var(--color-text-primary, #1f1f1f);
`;

const RoomInfo = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const DebateControls = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  margin: 0 24px;
`;

const ThemeControls = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
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
  judgeConfig?: {
    scores: any[];
    currentRoundScores: any[];
  };
}

// 初始 UI 状态
const initialUIState: UIState = {
  isLoading: false,
  isDarkMode: false,
  playerListWidth: 350,
  showDebugger: false,
  currentSpeaker: null,
  currentRound: 1,
  status: DebateStatus.PREPARING,
  history: {
    speeches: [],
    scores: []
  },
  streamingSpeech: null,
  players: [],
  judgeConfig: {
    scores: [],
    currentRoundScores: []
  }
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
  dimensions: {
    name: string;
    weight: number;
    description: string;
    criteria: string[];
  }[];
  totalScore: number;
  selectedJudge?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// 添加导出按钮样式
const ExportButton = styled(Button)`
  margin-left: 8px;
`;

const PlayerAvatarWrapper = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: ${props => props.isDarkMode ? '#2d2d2d' : '#ffffff'};
`;

const PlayerInfoWrapper = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StyledDiv = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StyledDivRow = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CharacterContent = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CharacterPersonaContent = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ModelWrapper = styled.div<{ isDarkMode?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const AIBadge = styled.span<{ isDarkMode?: boolean }>`
  font-size: 12px;
  padding: 2px 8px;
  background: ${props => props.isDarkMode ? 'rgba(24, 144, 255, 0.2)' : 'rgba(24, 144, 255, 0.1)'};
  color: ${props => props.isDarkMode ? '#87a9ff' : '#1890ff'};
  border-radius: 4px;
`;

export const DebateRoom: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: gameConfig } = useStore('gameConfig');
  const { state: modelState } = useStore('model');
  const { state: characterState } = useCharacter();
  
  // 将 useRef 移到组件内部
  const currentStateRef = useRef<UIState>(initialUIState);

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

  // 修改初始化effect
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
        
        const initialState = {
          ...initialUIState,
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
        };

        // 同时更新ref和state
        currentStateRef.current = initialState;
        setUiState(initialState);
        
        isInitialized = true;
        console.log('辩论室初始化完成，当前状态:', currentStateRef.current);
        
      } catch (error) {
        console.error('初始化辩论室失败:', error);
        message.error('初始化辩论室失败');
        const errorState = {
          ...initialUIState,
          isLoading: false
        };
        currentStateRef.current = errorState;
        setUiState(errorState);
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
    try {
      if (newStatus === 'ongoing' && uiState.status === 'preparing') {
        // 1. 开始辩论
        await debateActions.startDebate();
        
        // 2. 更新UI状态并等待更新完成
        await new Promise<void>((resolve) => {
          setUiState(prev => {
            const newState: UIState = {
              ...prev,
              status: newStatus,
              currentRound: 1
            };
            console.log('更新后的状态:', newState);
            return newState;
          });
          // 使用requestAnimationFrame确保状态已更新
          requestAnimationFrame(() => {
            console.log('状态更新完成');
            resolve();
          });
        });

        // 3. 如果第一位是AI，等待状态更新后再生成发言
        if (uiState.currentSpeaker?.isAI) {
          console.log('第一位是AI，准备生成发言');
          try {
            const speech: SpeechInput = {
              playerId: uiState.currentSpeaker.id,
              type: 'speech',
              content: ''
            };
            console.log('准备提交AI发言:', speech);
            await handleSpeechSubmit(speech);
          } catch (error) {
            console.error('AI发言生成失败:', error);
            message.error('AI发言生成失败，请重试');
          }
        }
      }
    } catch (error) {
      console.error('状态更新失败:', error);
      message.error('开始辩论失败，请重试');
      // 恢复到准备状态
      setUiState(prev => ({
        ...prev,
        status: 'preparing' as DebateStatus
      }));
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
    if (!gameConfig?.debate?.judging?.dimensions) {
      console.warn('评分维度未配置');
      return null;
    }

    return (
      <div className="scores-panel">
        <h3>评分维度</h3>
        <div className="dimensions-list">
          {gameConfig.debate.judging.dimensions.map((dimension: ScoringDimension) => (
            <div key={dimension.name} className="dimension-item">
              <div className="dimension-header">
                <span className="dimension-name">{dimension.name}</span>
                <span className="dimension-weight">权重: {dimension.weight}</span>
              </div>
              <p className="dimension-desc">{dimension.description}</p>
              <div className="dimension-criteria">
                {dimension.criteria.map((criterion: string, index: number) => (
                  <span key={index} className="criterion-tag">{criterion}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染评分统计
  const renderScoreStatistics = () => {
    if (!gameConfig?.debate?.judging?.dimensions || !uiState.judgeConfig?.scores) {
      return null;
    }

    const dimensions = gameConfig.debate.judging.dimensions;
    const scores = uiState.judgeConfig.scores;

    // ... rest of the renderScoreStatistics function ...
  };

  // 处理发言提交
  const handleSpeechSubmit = async (speech: SpeechInput) => {
    try {
      console.log('提交发言，详细信息:', {
        speech,
        currentSpeaker: uiState.currentSpeaker,
        currentState: {
          players: uiState.players.map(p => `${p.id}:${p.name}`),
          status: uiState.status,
          round: uiState.currentRound
        }
      });

      // 检查发言权限
      if (!uiState.currentSpeaker) {
        console.error('当前没有发言者');
        throw new Error('当前没有发言者');
      }

      if (speech.playerId !== uiState.currentSpeaker.id) {
        console.error('发言权限检查失败:', {
          attemptingSpeakerId: speech.playerId,
          currentSpeakerId: uiState.currentSpeaker.id,
          currentSpeakerName: uiState.currentSpeaker.name
        });
        throw new Error(`不是当前发言者 (当前发言者: ${uiState.currentSpeaker.name})`);
      }

      console.log('发言权限检查通过，提交发言');
      await debateActions.submitSpeech(speech);
      console.log('发言提交成功');
    } catch (error) {
      console.error('发言提交失败:', error);
      message.error(`发言提交失败: ${error instanceof Error ? error.message : '未知错误'}`);
      throw error;
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

  // 添加缺失的函数
  const handleSpeechComplete = async (speech: BaseDebateSpeech) => {
    try {
      setUiState(prev => ({
        ...prev,
        history: {
          ...prev.history,
          speeches: [...prev.history.speeches, speech]
        }
      }));

      // 找到当前发言者在players数组中的位置
      const currentIndex = uiState.players.findIndex(p => p.id === uiState.currentSpeaker?.id);
      
      if (currentIndex === -1) {
        console.error('当前发言者未找到');
        return;
      }

      const isLastSpeaker = currentIndex === uiState.players.length - 1;
      const nextSpeaker = isLastSpeaker ? uiState.players[0] : uiState.players[currentIndex + 1];

      if (isLastSpeaker) {
        // 如果是最后一个发言者，进入下一轮
        setUiState(prev => ({
          ...prev,
          currentRound: prev.currentRound + 1,
          currentSpeaker: nextSpeaker
        }));
      } else {
        // 否则切换到下一个发言者
        setUiState(prev => ({
          ...prev,
          currentSpeaker: nextSpeaker
        }));
      }

      // 如果下一个发言者是AI，自动开始生成发言
      if (nextSpeaker.isAI) {
        await handleSpeechSubmit({
          playerId: nextSpeaker.id,
          type: 'speech',
          content: ''
        });
      }
    } catch (error) {
      console.error('处理演讲完成时出错:', error);
      message.error('处理演讲完成时出错');
    }
  };

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

  // 添加返回配置的处理函数
  const handleBackToConfig = () => {
    // 将当前配置作为state传递给配置页面
    navigate('/game-config', {
      state: {
        lastConfig: {
          ...gameConfig,
          debate: {
            ...gameConfig.debate,
            topic: {
              ...gameConfig.debate.topic,
              rounds: gameConfig.debate.topic.rounds || 3
            }
          }
        }
      }
    });
  };

  // 替换原有的exportToPDF函数
  const exportService = useMemo(() => new ExportService(), []);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleExport = async (type: 'pdf' | 'image') => {
    try {
      message.loading('正在生成导出文件...', 0);

      if (type === 'pdf') {
        await exportService.exportToPDF({
          title: gameConfig?.debate?.topic?.title || '辩论记录',
          description: gameConfig?.debate?.topic?.description,
          speeches: uiState.history.speeches,
          scores: uiState.history.scores,
          dimensions: gameConfig?.debate?.judging?.dimensions || []
        });
      } else {
        if (!contentRef.current) {
          throw new Error('内容区域未找到');
        }
        await exportService.exportToImage(contentRef.current);
      }

      message.destroy();
    } catch (error) {
      message.destroy();
      message.error('导出失败：' + (error instanceof Error ? error.message : '未知错误'));
      console.error('导出错误:', error);
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
      <ThemeProvider theme={theme}>
        <Container isDarkMode={uiState.isDarkMode}>
          <TopBar isDarkMode={uiState.isDarkMode}>
            <RoomInfo isDarkMode={uiState.isDarkMode}>
              <BackButton isDarkMode={uiState.isDarkMode} onClick={handleBackToConfig}>
                <RollbackOutlined />
                返回配置
              </BackButton>
              <RoomTitle>{gameConfig?.debate?.topic?.title || '辩论室'}</RoomTitle>
            </RoomInfo>
            <DebateControls isDarkMode={uiState.isDarkMode}>
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
                scoringRules={gameConfig.debate.judging?.dimensions}
                judge={judgeInfo}
                speeches={uiState.history.speeches}
              />
            </DebateControls>
            <ThemeControls isDarkMode={uiState.isDarkMode}>
              <ToolButton isDarkMode={uiState.isDarkMode} onClick={handleThemeChange}>
                {uiState.isDarkMode ? <BulbFilled /> : <BulbOutlined />}
                {uiState.isDarkMode ? '浅色模式' : '深色模式'}
              </ToolButton>
            </ThemeControls>
          </TopBar>

          {/* 主题信息区域 */}
          <TopicBar isDarkMode={uiState.isDarkMode}>
            <TopicSection isDarkMode={uiState.isDarkMode}>
              <TopicTitle isDarkMode={uiState.isDarkMode}>{gameConfig?.debate?.topic?.title || '未设置辩题'}</TopicTitle>
              <TopicInfo isDarkMode={uiState.isDarkMode}>
                <div>{gameConfig?.debate?.topic?.description || '暂无描述'}</div>
              </TopicInfo>
            </TopicSection>

            {judgeInfo && (
              <JudgeSection isDarkMode={uiState.isDarkMode}>
                <JudgeAvatar>
                  <img 
                    src={judgeInfo.avatar} 
                    alt={judgeInfo.name}
                  />
                  <JudgeTooltip isDarkMode={uiState.isDarkMode} className="judge-tooltip">
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
                          {renderScores()}
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
          <MainContent isDarkMode={uiState.isDarkMode}>
            <Resizable
              size={{ width: uiState.playerListWidth || 350, height: '100%' }}
              onResizeStop={handleResizeStop}
              enable={{ right: true }}
              minWidth={250}
              maxWidth={450}
            >
              <PlayerListSection isDarkMode={uiState.isDarkMode}>
                <PlayerListHeader isDarkMode={uiState.isDarkMode}>
                  <StyledDiv className="title">参赛选手</StyledDiv>
                  <StyledDiv className="count">{uiState.players.length}/4</StyledDiv>
                </PlayerListHeader>
                <PlayerListContainer isDarkMode={uiState.isDarkMode}>
                  {uiState.players.map((player: UnifiedPlayer) => {
                    const character = player.characterId ? characterConfigs[player.characterId] : undefined;
                    return (
                      <PlayerCard 
                        key={player.id}
                        active={player.id === uiState.currentSpeaker?.id}
                        isDarkMode={uiState.isDarkMode}
                      >
                        <PlayerHeader isDarkMode={uiState.isDarkMode}>
                          <PlayerAvatarWrapper isDarkMode={uiState.isDarkMode}>
                            <PlayerAvatar 
                              src={character?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id}`}
                              alt={player.name}
                              isDarkMode={uiState.isDarkMode}
                            />
                            <PlayerInfoWrapper isDarkMode={uiState.isDarkMode}>
                              <PlayerName isDarkMode={uiState.isDarkMode}>
                                {player.name}
                              </PlayerName>
                              <PlayerRole isDarkMode={uiState.isDarkMode}>
                                {gameConfig?.debate?.rules?.debateFormat === 'structured' ? (
                                  <StyledDiv>
                                    {player.role.includes('affirmative') ? '正方' : 
                                     player.role.includes('negative') ? '反方' : 
                                     player.role === 'judge' ? '裁判' : 
                                     player.role === 'timekeeper' ? '计时员' : '观众'}
                                    {player.role.includes('1') && ' - 一辩'}
                                    {player.role.includes('2') && ' - 二辩'}
                                    {player.role.includes('3') && ' - 三辩'}
                                    {player.role.includes('4') && ' - 四辩'}
                                  </StyledDiv>
                                ) : (
                                  <StyledDiv>
                                    {player.role === 'free' ? '自由辩手' : 
                                     player.role === 'judge' ? '裁判' : 
                                     player.role === 'timekeeper' ? '计时员' : 
                                     player.role === 'unassigned' ? '未分配' : '观众'}
                                  </StyledDiv>
                                )}
                              </PlayerRole>
                            </PlayerInfoWrapper>
                          </PlayerAvatarWrapper>
                          {character && (
                            <CharacterInfo isDarkMode={uiState.isDarkMode}>
                              <CharacterContent isDarkMode={uiState.isDarkMode}>
                                <CharacterName isDarkMode={uiState.isDarkMode}>
                                  {character.name}
                                  {player.isAI && (
                                    <AIBadge isDarkMode={uiState.isDarkMode}>
                                      AI
                                    </AIBadge>
                                  )}
                                </CharacterName>
                                {character.description && (
                                  <CharacterDescription isDarkMode={uiState.isDarkMode}>
                                    {character.description}
                                  </CharacterDescription>
                                )}
                                {character?.persona && (
                                  <CharacterPersonaContent>
                                    {character.persona.background} · {character.persona.speakingStyle}
                                  </CharacterPersonaContent>
                                )}
                                <ModelWrapper>
                                  {getModelInfo(character.id)}
                                </ModelWrapper>
                              </CharacterContent>
                            </CharacterInfo>
                          )}
                        </PlayerHeader>
                      </PlayerCard>
                    );
                  })}
                </PlayerListContainer>
              </PlayerListSection>
            </Resizable>

            <ContentArea isDarkMode={uiState.isDarkMode} ref={contentRef}>
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
        </Container>
      </ThemeProvider>
    </DebateErrorBoundary>
  );
};
