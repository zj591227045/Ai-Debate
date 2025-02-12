import type { UnifiedRole, RoleStatus } from './roles';

export type { DebateRole } from './roles';

export interface Player {
  id: string;
  name: string;
  role: UnifiedRole;
  isAI: boolean;
  characterId?: string;  // 关联的AI角色ID
  order?: number;        // 发言顺序
  status?: RoleStatus;
  avatar?: string;
}

export interface PlayerProps {
  player: Player;
  onUpdate?: (player: Player) => void;
  onRemove?: (playerId: string) => void;
}

export interface PlayerState {
  players: Player[];
  selectedCharacterId?: string;
}