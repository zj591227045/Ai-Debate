import type { Player as ConfigPlayer, DebateRole } from './player';
import type { Player as RoomPlayer } from './index';
import type { RuleConfig } from './rules';
import type { DebateConfig, Topic as LegacyTopic } from './debate';
import type { CSSProperties } from 'react';

// 自定义样式类型
export type StyleProperties = CSSProperties & Record<string, string | number>;

// 新的统一类型定义（从 type_definitions.md）
export interface UnifiedPlayer {
  id: string;
  name: string;
  role: 'affirmative' | 'negative' | 'free' | 'judge' | 'unassigned';
  isAI: boolean;
  characterId?: string;
  avatar?: string;
  status: 'ready' | 'speaking' | 'waiting' | 'finished';
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
  avatar: undefined, // 需要从其他地方获取
  status: 'ready' // 默认状态
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
  order: existingPlayers.length + 1
});

// 房间玩家到统一玩家的转换
export const roomToUnifiedPlayer = (player: RoomPlayer): UnifiedPlayer => ({
  id: player.id,
  name: player.name,
  role: reverseRoleMap[player.role],
  isAI: false, // 需要从其他地方获取
  avatar: player.avatar,
  status: player.isActive ? 'ready' : 'waiting'
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
  timestamp: number;
  round: number;
  references: string[];
  scores?: Score[];
}

export interface Score {
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