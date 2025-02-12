import type { Player as ConfigPlayer, DebateRole } from './player';
import type { Player as RoomPlayer } from './index';
import type { RuleConfig } from './rules';
import type { DebateConfig, Topic as LegacyTopic } from './debate';
import type { CSSProperties } from 'react';
import { Message } from '../modules/llm/types/common';
import type { UnifiedRole, RoleStatus } from './roles';
import type { GameConfigState } from './config';
import { generateId } from './roles';

// AI角色特征接口
export interface AICharacteristics {
  personality?: string;    // 性格特征
  speakingStyle?: string; // 说话风格
  background?: string;    // 专业背景
  values?: string;        // 价值观
  argumentationStyle?: string; // 论证风格
}

// 扩展现有的Player类型
declare module './player' {
  interface Player extends AICharacteristics {
    aiConfig?: {
      enabled: boolean;
      settings?: Record<string, unknown>;
    };
  }
}

declare module './index' {
  interface Player extends AICharacteristics {
    aiConfig?: {
      enabled: boolean;
      settings?: Record<string, unknown>;
    };
  }
}

// 自定义样式类型
export type StyleProperties = CSSProperties & Record<string, string | number>;

// 玩家显示适配器接口
export interface PlayerDisplayAdapter {
  avatar?: string;
  isActive?: boolean;
}

// 玩家类型适配器接口
export interface PlayerTypeAdapter extends PlayerDisplayAdapter {
  characterId?: string;
}

// 统一玩家类型
export interface UnifiedPlayer extends AICharacteristics {
  id: string;
  name: string;
  role: UnifiedRole;
  isAI: boolean;
  characterId?: string;
  order?: number;
  status?: RoleStatus;
  avatar?: string;
}

export interface UnifiedTopic {
  title: string;
  background: string;
}

export interface UnifiedScore {
  id: string;
  judgeId: string;
  playerId: string;
  speechId: string;
  round: number;
  timestamp: number;
  dimensions: Record<string, number>;
  totalScore: number;
  comment: string;
}

// 角色映射
export const roleMap: Record<DebateRole, 'for' | 'against' | 'neutral'> = {
  'affirmative1': 'for',
  'affirmative2': 'for',
  'negative1': 'against',
  'negative2': 'against',
  'judge': 'neutral',
  'timekeeper': 'neutral',
  'unassigned': 'neutral',
  'observer': 'neutral'
};

// 统一角色映射
export const unifiedRoleMap: Record<string, UnifiedRole> = {
  affirmative1: 'affirmative1',
  affirmative2: 'affirmative2',
  negative1: 'negative1',
  negative2: 'negative2',
  judge: 'judge',
  timekeeper: 'observer',
  unassigned: 'unassigned'
};

// 反向角色映射
export const reverseRoleMap: Record<'for' | 'against' | 'neutral', DebateRole> = {
  'for': 'affirmative1',
  'against': 'negative1',
  'neutral': 'unassigned'
};

// 配置玩家到统一玩家的转换
export function configToUnifiedPlayer(player: any): UnifiedPlayer {
  return {
    id: player.id || generateId(),
    name: player.name || '未命名选手',
    role: mapLegacyRole(player.role || 'unassigned'),
    isAI: player.isAI ?? true,
    characterId: player.characterId,
    order: player.order,
    status: player.status || 'waiting',
    avatar: player.avatar
  };
}

// 映射旧的角色类型到新的统一角色类型
function mapLegacyRole(role: string): UnifiedRole {
  switch (role) {
    case 'affirmative':
      return 'affirmative1';
    case 'negative':
      return 'negative1';
    case 'unassigned':
      return 'observer';
    default:
      return role as UnifiedRole;
  }
}

// 统一玩家到配置玩家的转换
export const unifiedToConfigPlayer = (
  player: UnifiedPlayer,
  existingPlayers: ConfigPlayer[]
): ConfigPlayer => {
  const baseRole = player.role === 'judge' ? 'judge' : 
                  player.role === 'unassigned' ? 'unassigned' :
                  player.role as 'affirmative' | 'negative';
                  
  return {
    id: player.id,
    name: player.name,
    role: baseRole === 'judge' ? 'judge' : 
          baseRole === 'unassigned' ? 'unassigned' :
          getSpecificRole(baseRole, existingPlayers),
    isAI: player.isAI,
    characterId: player.characterId,
    order: player.order ?? existingPlayers.length + 1,
    personality: player.personality,
    speakingStyle: player.speakingStyle,
    background: player.background,
    values: player.values,
    argumentationStyle: player.argumentationStyle
  };
};

// 房间玩家到统一玩家的转换
export const roomToUnifiedPlayer = (player: RoomPlayer & PlayerTypeAdapter): UnifiedPlayer => {
  const unified: UnifiedPlayer = {
    id: player.id,
    name: player.name,
    role: reverseRoleMap[player.role],
    isAI: false,
    status: player.isActive ? 'ready' : 'waiting',
    avatar: player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id}`
  };
  
  if ('characterId' in player && player.characterId) {
    unified.characterId = player.characterId;
  }

  // 复制 AI 特征
  if ('personality' in player) unified.personality = player.personality;
  if ('speakingStyle' in player) unified.speakingStyle = player.speakingStyle;
  if ('background' in player) unified.background = player.background;
  if ('values' in player) unified.values = player.values;
  if ('argumentationStyle' in player) unified.argumentationStyle = player.argumentationStyle;
  
  return unified;
};

// 旧主题到统一主题的转换
export const legacyToUnifiedTopic = (topic: LegacyTopic): UnifiedTopic => ({
  title: topic.title,
  background: `${topic.description}\n\n${topic.background || ''}`
});

// 统一主题到旧主题的转换
export const unifiedToLegacyTopic = (topic: UnifiedTopic): LegacyTopic => {
  const [description, ...rest] = topic.background.split('\n\n');
  return {
    title: topic.title,
    description,
    background: rest.join('\n\n'),
    type: 'structured' // 默认类型
  };
};

// 删除本地的 GameConfigState 接口定义
export type ConfigToRoomPlayer = (player: ConfigPlayer) => RoomPlayer;
export type RoomToConfigPlayer = (player: RoomPlayer, existingPlayers: ConfigPlayer[]) => ConfigPlayer;

// 状态转换层接口
export interface StateTransformer<T, U> {
  transform(state: T): U;
  reverseTransform(state: U): T;
}

// 游戏配置状态转换器
export class GameConfigTransformer implements StateTransformer<GameConfigState, any> {
  public toUnified(state: Partial<GameConfigState>): Partial<GameConfigState> {
    if (!state) return {};
    
    return {
      ...state,
      players: state.players?.map((player: UnifiedPlayer) => ({
        ...player,
        role: unifiedRoleMap[player.role] || 'unassigned',
        isAI: player.isAI ?? true
      }))
    };
  }

  public fromUnified(state: GameConfigState): GameConfigState {
    return {
      ...state,
      players: state.players.map((player: UnifiedPlayer) => ({
        ...player,
        role: player.role,
        isAI: player.isAI ?? true
      }))
    };
  }

  public transform(state: GameConfigState): any {
    return this.toUnified(state);
  }

  public reverseTransform(state: any): GameConfigState {
    return this.fromUnified(state as GameConfigState);
  }
}

// 类型守卫函数
export const isUnifiedPlayer = (player: any): player is UnifiedPlayer => {
  return (
    typeof player === 'object' &&
    'id' in player &&
    'name' in player &&
    'role' in player
  );
};

export const isLegacyPlayer = (player: any): player is ConfigPlayer => {
  return (
    typeof player === 'object' &&
    'id' in player &&
    'name' in player &&
    'role' in player &&
    player.role.match(/^(affirmative|negative)\d|judge|timekeeper|unassigned$/)
  );
};

// 获取具体角色
export const getSpecificRole = (
  baseRole: string,
  players: ConfigPlayer[]
): UnifiedRole => {
  if (baseRole === 'unassigned' || baseRole === 'judge' || baseRole === 'timekeeper' || baseRole === 'observer') {
    return baseRole as UnifiedRole;
  }
  
  const existingRoles = players
    .filter(p => p.role.startsWith(baseRole))
    .map(p => p.role);

  if (baseRole === 'affirmative') {
    if (!existingRoles.includes('affirmative1')) return 'affirmative1';
    if (!existingRoles.includes('affirmative2')) return 'affirmative2';
  } else if (baseRole === 'negative') {
    if (!existingRoles.includes('negative1')) return 'negative1';
    if (!existingRoles.includes('negative2')) return 'negative2';
  }
  
  return 'unassigned';
};

// 基础类型定义
export interface BaseDebateSpeech {
  id: string;
  playerId: string;
  content: string;
  timestamp: string;
  round: number;
  role?: 'user' | 'assistant';  // 设为可选
  type?: 'speech' | 'innerThought';
  references: string[];
  scores?: BaseDebateScore[];
}

export interface BaseDebateScore {
  id: string;
  judgeId: string;
  playerId: string;
  speechId: string;
  round: number;
  timestamp: string;
  dimensions: Record<string, number>;
  totalScore: number;
  comment: string;
  value?: number;  // 设为可选
  criteria?: string;  // 设为可选
}

// 使用类型别名重新导出
export type Speech = BaseDebateSpeech;
export type Score = BaseDebateScore;

export interface DebateRoomLayout {
  grid: {
    template: string;
  };
  regions: {
    header: {
      components: {
        navigation: {
          backButton?: boolean;
          roundInfo?: boolean;
          themeSwitch?: boolean;
          saveSession?: boolean;
          debateControl: boolean;
        };
        info: {
          topic?: {
            title: string;
            background: string;
          };
          format?: string;
          currentRound?: number;
        };
        judge?: {
          judge: UnifiedPlayer | null;
        };
      };
      style: StyleProperties;
    };
    players: {
      components: {
        playerList: {
          players: UnifiedPlayer[];
          currentSpeaker?: string;
          nextSpeaker?: string;
        };
        statistics?: {
          scores: Record<string, number>;
          speakingCount: Record<string, number>;
        };
      };
      style: StyleProperties;
    };
    content: {
      components: {
        speechHistory?: Speech[];
        currentSpeech?: Speech;
        innerThoughts?: string;
        judgeComments?: string[];
      };
      style: StyleProperties;
    };
  };
  theme: {
    mode: 'light' | 'dark';
    colors: Record<string, string>;
  };
}

// 基础类型定义
export type DebateStatus = 'preparing' | 'ongoing' | 'paused' | 'finished';

// 统一事件类型
export interface DebateEvent {
  type: DebateEventType;
  timestamp: string;  // 修改为 string 类型
  data?: any;
}

export type DebateEventType = 
  | 'debate_start' 
  | 'debate_pause' 
  | 'debate_resume' 
  | 'debate_end'
  | 'round_start'
  | 'round_end'
  | 'speech_start'
  | 'speech_end';

// 统一进度类型
export interface DebateProgress {
  currentRound: number;
  totalRounds: number;
  currentSpeaker?: string;
  nextSpeaker?: string;
  speakingOrder: string[];
}

// 统一历史记录类型
export interface DebateHistory {
  speeches: Speech[];
  scores: Score[];
  events: DebateEvent[];
}

export interface BaseAdapter {
  initialize(): Promise<void>;
  validate(): Promise<void>;
  process(input: Message[]): Promise<Message>;
}

export type IDebateAdapter = BaseAdapter & {
  processDebate?: (context: any) => Promise<any>;
};

export type ICharacterAdapter = BaseAdapter & {
  processCharacter?: (context: any) => Promise<any>;
};

// 只保留一个导出声明
export type { GameConfigState } from './config';

// 移除重复的导出声明 

// 默认玩家配置
export const DEFAULT_PLAYER: UnifiedPlayer = {
  id: '',
  name: '',
  role: 'unassigned',
  isAI: false,
  status: 'waiting'
}; 