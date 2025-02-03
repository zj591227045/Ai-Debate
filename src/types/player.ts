export type DebateRole = 'affirmative1' | 'affirmative2' | 'negative1' | 'negative2' | 'judge' | 'timekeeper' | 'unassigned';

export interface Player {
  id: string;
  name: string;
  role: DebateRole;
  isAI: boolean;
  characterId?: string;  // 关联的AI角色ID
  order?: number;        // 发言顺序
}

export interface PlayerState {
  players: Player[];
  selectedCharacterId?: string;
} 