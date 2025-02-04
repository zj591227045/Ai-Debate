import type { GameConfigState } from '../../types/adapters';
import type { Player as RoomPlayer } from '../../types/index';
import type { Player as ConfigPlayer } from '../../types/player';
import { roleMap, reverseRoleMap, getSpecificRole } from '../../types/adapters';

// 配置页面玩家到辩论室玩家的转换
export const adaptConfigToRoomPlayer = (player: ConfigPlayer): RoomPlayer => {
  return {
    id: player.id,
    name: player.name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.id}`,
    role: roleMap[player.role],
    score: 0,
    isActive: false
  };
};

// 辩论室玩家到配置页面玩家的转换
export const adaptRoomToConfigPlayer = (
  player: RoomPlayer,
  existingPlayers: ConfigPlayer[]
): ConfigPlayer => {
  const baseRole = reverseRoleMap[player.role];
  return {
    id: player.id,
    name: player.name,
    role: getSpecificRole(baseRole, existingPlayers),
    isAI: true, // 默认为AI玩家
    characterId: undefined,
    order: undefined
  };
};

// 游戏配置状态到辩论室状态的转换
export const adaptStateToRoom = (state: GameConfigState) => {
  return {
    players: state.players.map(adaptConfigToRoomPlayer),
    debate: state.debate,
    ruleConfig: state.ruleConfig
  };
};

// 辩论室状态到游戏配置状态的转换
export const adaptRoomToState = (roomState: any): Partial<GameConfigState> => {
  const players = roomState.players.map((player: RoomPlayer, index: number, array: RoomPlayer[]) => 
    adaptRoomToConfigPlayer(player, array.slice(0, index).map(p => 
      adaptRoomToConfigPlayer(p, [])
    ))
  );

  return {
    players,
    debate: roomState.debate,
    ruleConfig: roomState.ruleConfig
  };
}; 