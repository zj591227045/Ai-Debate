import type { Player as ConfigPlayer, DebateRole } from './player';
import type { Player as RoomPlayer } from './index';
import type { RuleConfig } from './rules';
import type { DebateConfig, Topic as LegacyTopic } from './debate';
import type { CSSProperties } from 'react';

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
  interface Player extends AICharacteristics {}
}

declare module './index' {
  interface Player extends AICharacteristics {}
}

// 自定义样式类型
export type StyleProperties = CSSProperties & Record<string, string | number>;

// 新的统一类型定义（从 type_definitions.md）
export interface UnifiedPlayer {
  id: string;
  name: string;
  role: 'affirmative' | 'negative' | 'free' | 'judge' | 'unassigned';
  isAI: boolean;
  characterId?: string;
  modelId?: string;
  avatar?: string;
  status: 'ready' | 'speaking' | 'waiting' | 'finished';
  
  // AI角色特征
  personality?: string;    // 性格特征
  speakingStyle?: string; // 说话风格
  background?: string;    // 专业背景
  values?: string;        // 价值观
  argumentationStyle?: string; // 论证风格
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

// 现有的角色映射
export const roleMap: Record<DebateRole, RoomPlayer['role']> = {
  affirmative1: 'for',
  affirmative2: 'for',
  negative1: 'against',
  negative2: 'against',
  judge: 'neutral',
  timekeeper: 'neutral',
  unassigned: 'neutral'
};

// 统一角色映射
export const unifiedRoleMap: Record<DebateRole, UnifiedPlayer['role']> = {
  affirmative1: 'affirmative',
  affirmative2: 'affirmative',
  negative1: 'negative',
  negative2: 'negative',
  judge: 'judge',
  timekeeper: 'unassigned',
  unassigned: 'unassigned'
};

// 配置玩家到统一玩家的转换
export const configToUnifiedPlayer = (player: ConfigPlayer): UnifiedPlayer => ({
  id: player.id,
  name: player.name,
  role: unifiedRoleMap[player.role],
  isAI: player.isAI,
  characterId: player.characterId,
  avatar: undefined,
  status: 'ready',
  ...(player as AICharacteristics) // 使用类型断言安全地传递AI特征
});

// 统一玩家到配置玩家的转换
export const unifiedToConfigPlayer = (
  player: UnifiedPlayer,
  existingPlayers: ConfigPlayer[]
): ConfigPlayer => ({
  id: player.id,
  name: player.name,
  role: player.role === 'judge' ? 'judge' : 
        player.role === 'free' ? 'unassigned' :
        getSpecificRole(player.role, existingPlayers),
  isAI: player.isAI,
  characterId: player.characterId,
  order: existingPlayers.length + 1,
  ...(player as AICharacteristics) // 使用类型断言安全地传递AI特征
});

// 房间玩家到统一玩家的转换
export const roomToUnifiedPlayer = (player: RoomPlayer): UnifiedPlayer => ({
  id: player.id,
  name: player.name,
  role: reverseRoleMap[player.role],
  isAI: false,
  avatar: player.avatar,
  status: player.isActive ? 'ready' : 'waiting',
  ...(player as AICharacteristics) // 使用类型断言安全地传递AI特征
});

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

// 其他现有的导出
export type ConfigToRoomPlayer = (player: ConfigPlayer) => RoomPlayer;
export type RoomToConfigPlayer = (player: RoomPlayer, existingPlayers: ConfigPlayer[]) => ConfigPlayer;

export interface GameConfigState {
  topic: {
    title: string;
    description: string;
  };
  rules: {
    totalRounds: number;
    debateFormat: string;
  };
  debate: DebateConfig;
  players: ConfigPlayer[];
  ruleConfig: RuleConfig;
  isConfiguring: boolean;
}

// 类型守卫函数
export const isUnifiedPlayer = (player: any): player is UnifiedPlayer => {
  return (
    typeof player === 'object' &&
    'id' in player &&
    'name' in player &&
    'role' in player &&
    'isAI' in player &&
    'status' in player
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
  baseRole: 'affirmative' | 'negative' | 'unassigned',
  players: ConfigPlayer[]
): DebateRole => {
  if (baseRole === 'unassigned') return 'unassigned';
  
  const existingRoles = players
    .filter(p => p.role.startsWith(baseRole))
    .map(p => p.role);

  if (!existingRoles.includes(`${baseRole}1`)) return `${baseRole}1` as DebateRole;
  if (!existingRoles.includes(`${baseRole}2`)) return `${baseRole}2` as DebateRole;
  return 'unassigned';
};

// 反向角色映射
export const reverseRoleMap: Record<RoomPlayer['role'], 'affirmative' | 'negative' | 'unassigned'> = {
  for: 'affirmative',
  against: 'negative',
  neutral: 'unassigned'
};

export interface Speech {
  id: string;
  playerId: string;
  content: string;
  timestamp: string;  // 统一使用 ISO 字符串格式
  round: number;
  type?: 'speech' | 'innerThought';
  references: string[];
  scores?: Score[];
}

export interface Score {
  id: string;
  judgeId: string;
  playerId: string;
  speechId: string;
  round: number;
  timestamp: string;  // 修改为 string 类型
  dimensions: Record<string, number>;
  totalScore: number;
  comment: string;
}

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

// 统一发言类型
export interface Speech {
  id: string;
  playerId: string;
  content: string;
  timestamp: string;
  round: number;
  type?: 'speech' | 'innerThought';
  references: string[];
  scores?: Score[];
}

// 统一评分类型
export interface Score {
  id: string;
  judgeId: string;
  playerId: string;
  speechId: string;
  round: number;
  timestamp: string;  // 修改为 string 类型
  dimensions: Record<string, number>;
  totalScore: number;
  comment: string;
}

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