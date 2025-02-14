/**
 * 基础角色类型
 */
export type BaseRole = 'player' | 'judge' | 'observer';

/**
 * 辩手阵营类型
 */
export type DebaterSide = 'affirmative' | 'negative';

/**
 * 辩手位置类型
 */
export type DebaterPosition = '1' | '2' | '3';

/**
 * 辩手角色类型
 */
export type DebateRole = 'affirmative1' | 'affirmative2' | 'negative1' | 'negative2' | 'judge' | 'timekeeper' | 'unassigned' | 'observer' | 'free';

/**
 * 统一角色类型
 */
export type UnifiedRole = DebateRole;

/**
 * 角色状态
 */
export type RoleStatus = 'ready' | 'waiting' | 'speaking' | 'finished';

/**
 * 角色权限
 */
export interface RolePermissions {
  canSpeak: boolean;
  canJudge: boolean;
  canModerate: boolean;
  canObserve: boolean;
}

/**
 * 获取角色权限
 */
export const getRolePermissions = (role: UnifiedRole): RolePermissions => {
  switch (role) {
    case 'observer':
      return {
        canSpeak: false,
        canJudge: false,
        canModerate: false,
        canObserve: true
      };
    case 'judge':
      return {
        canSpeak: false,
        canJudge: true,
        canModerate: true,
        canObserve: true
      };
    default:
      if (role.startsWith('affirmative') || role.startsWith('negative')) {
        return {
          canSpeak: true,
          canJudge: false,
          canModerate: false,
          canObserve: true
        };
      }
      return {
        canSpeak: false,
        canJudge: false,
        canModerate: false,
        canObserve: true
      };
  }
};

/**
 * 角色映射类型
 */
export interface RoleMapping {
  unified: UnifiedRole;
  display: string;
  legacy: string;
}

/**
 * 角色映射表
 */
export const ROLE_MAPPINGS: Record<UnifiedRole, RoleMapping> = {
  judge: {
    unified: 'judge',
    display: '裁判',
    legacy: 'judge'
  },
  observer: {
    unified: 'observer',
    display: '观察者',
    legacy: 'observer'
  },
  timekeeper: {
    unified: 'timekeeper',
    display: '计时员',
    legacy: 'timekeeper'
  },
  affirmative1: {
    unified: 'affirmative1',
    display: '正方一辩',
    legacy: 'for'
  },
  affirmative2: {
    unified: 'affirmative2',
    display: '正方二辩',
    legacy: 'for'
  },
  negative1: {
    unified: 'negative1',
    display: '反方一辩',
    legacy: 'against'
  },
  negative2: {
    unified: 'negative2',
    display: '反方二辩',
    legacy: 'against'
  },
  unassigned: {
    unified: 'unassigned',
    display: '未分配',
    legacy: 'unassigned'
  },
  free: {
    unified: 'free',
    display: '自由',
    legacy: 'neutral'
  }
} as const;

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * 获取角色的默认状态
 */
export function getDefaultRoleStatus(role: UnifiedRole): RoleStatus {
  return 'waiting';
}

export const roleMap: Record<DebateRole, 'for' | 'against' | 'neutral'> = {
  'affirmative1': 'for',
  'affirmative2': 'for',
  'negative1': 'against',
  'negative2': 'against',
  'judge': 'neutral',
  'timekeeper': 'neutral',
  'unassigned': 'neutral',
  'observer': 'neutral',
  'free': 'neutral'
}; 