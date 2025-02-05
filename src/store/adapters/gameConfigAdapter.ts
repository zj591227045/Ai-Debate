import type { GameConfigState, UnifiedPlayer } from '../../types/adapters';
import type { Player as RoomPlayer } from '../../types/index';
import type { Player as ConfigPlayer } from '../../types/player';
import type { RoleAssignmentConfig } from '../../hooks/useRoleAssignment';
import type { DebateConfig } from '../../types/debate';
import { roleMap, reverseRoleMap, getSpecificRole, configToUnifiedPlayer } from '../../types/adapters';

// 配置页面玩家到辩论室玩家的转换
export const adaptConfigToRoomPlayer = (player: ConfigPlayer): UnifiedPlayer => {
  return configToUnifiedPlayer(player);
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

// 新增：RoleAssignment配置到GameConfig的转换
export const adaptRoleAssignmentToGameConfig = (
  roleConfig: {
    config: RoleAssignmentConfig;
    players: ConfigPlayer[];
  },
  debateConfig: DebateConfig,
  ruleConfig: any
): GameConfigState => {
  return {
    topic: {
      title: debateConfig.topic.title,
      description: debateConfig.topic.description
    },
    rules: {
      totalRounds: 4, // 默认值
      debateFormat: ruleConfig.format
    },
    debate: debateConfig,
    players: roleConfig.players,
    ruleConfig: ruleConfig,
    isConfiguring: true
  };
};

// 新增：配置对象到GameConfig的转换
export const adaptConfigToGameConfig = (
  config: {
    debate: DebateConfig;
    players: ConfigPlayer[];
    ruleConfig: any;
    isConfiguring: boolean;
  }
): GameConfigState => {
  return {
    topic: {
      title: config.debate.topic.title,
      description: config.debate.topic.description
    },
    rules: {
      totalRounds: 4, // 默认值
      debateFormat: config.ruleConfig.format
    },
    ...config
  };
}; 