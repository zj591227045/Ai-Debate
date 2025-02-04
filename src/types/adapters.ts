import type { Player as ConfigPlayer, DebateRole } from './player';
import type { Player as RoomPlayer } from './index';
import type { RuleConfig } from './rules';
import type { DebateConfig } from './debate';

// 角色映射
export const roleMap: Record<DebateRole, RoomPlayer['role']> = {
  affirmative1: 'for',
  affirmative2: 'for',
  negative1: 'against',
  negative2: 'against',
  judge: 'neutral',
  timekeeper: 'neutral',
  unassigned: 'neutral'
};

// 反向角色映射
export const reverseRoleMap: Record<RoomPlayer['role'], 'affirmative' | 'negative' | 'unassigned'> = {
  for: 'affirmative',
  against: 'negative',
  neutral: 'unassigned'
};

// 获取具体角色
export const getSpecificRole = (baseRole: 'affirmative' | 'negative' | 'unassigned', players: ConfigPlayer[]): DebateRole => {
  if (baseRole === 'unassigned') return 'unassigned';
  
  const existingRoles = players
    .filter(p => p.role.startsWith(baseRole))
    .map(p => p.role);

  if (!existingRoles.includes(`${baseRole}1`)) return `${baseRole}1` as DebateRole;
  if (!existingRoles.includes(`${baseRole}2`)) return `${baseRole}2` as DebateRole;
  return 'unassigned';
};

// 类型转换工具类型
export type ConfigToRoomPlayer = (player: ConfigPlayer) => RoomPlayer;
export type RoomToConfigPlayer = (player: RoomPlayer, existingPlayers: ConfigPlayer[]) => ConfigPlayer;

// 游戏配置状态接口
export interface GameConfigState {
  debate: DebateConfig;
  players: ConfigPlayer[];
  ruleConfig: RuleConfig;
  isConfiguring: boolean;
} 