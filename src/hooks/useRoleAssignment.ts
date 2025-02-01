import { useState, useCallback } from 'react';

export type DebateRole = 'affirmative1' | 'affirmative2' | 'negative1' | 'negative2' | 'judge' | 'timekeeper' | 'unassigned';

export interface Player {
  id: string;
  name: string;
  role: DebateRole;
  isAI: boolean;
}

export interface RoleAssignmentConfig {
  affirmativeCount: number;
  negativeCount: number;
  judgeCount: number;
  timekeeperCount: number;
  minPlayers: number;
  maxPlayers: number;
  autoAssign?: boolean;
}

export interface RoleAssignmentState {
  players: Player[];
  config: RoleAssignmentConfig;
}

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const useRoleAssignment = (initialPlayers: Player[], initialConfig: RoleAssignmentConfig) => {
  const [state, setState] = useState<RoleAssignmentState>({
    players: initialPlayers,
    config: {
      ...initialConfig,
      minPlayers: 4,
      maxPlayers: 6,
    },
  });

  const assignRole = useCallback((playerId: string, role: DebateRole) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(player =>
        player.id === playerId ? { ...player, role } : player
      ),
    }));
  }, []);

  const updatePlayer = useCallback((playerId: string, updates: Partial<Player>) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(player =>
        player.id === playerId ? { ...player, ...updates } : player
      ),
    }));
  }, []);

  const addPlayer = useCallback((name: string, isAI: boolean = true) => {
    setState(prev => {
      if (prev.players.length >= prev.config.maxPlayers) {
        return prev;
      }
      
      const newPlayer: Player = {
        id: `player_${Date.now()}`,
        name,
        role: 'unassigned',
        isAI,
      };

      return {
        ...prev,
        players: [...prev.players, newPlayer],
      };
    });
  }, []);

  const removePlayer = useCallback((playerId: string) => {
    setState(prev => {
      const remainingPlayers = prev.players.filter(p => p.id !== playerId);
      if (remainingPlayers.length < prev.config.minPlayers) {
        return prev;
      }

      return {
        ...prev,
        players: remainingPlayers,
      };
    });
  }, []);

  const autoAssignRoles = useCallback(() => {
    const { affirmativeCount, negativeCount, judgeCount, timekeeperCount } = state.config;
    const unassignedPlayers = shuffleArray(state.players.filter(p => p.role === 'unassigned'));
    let currentIndex = 0;

    const newPlayers = [...state.players];
    
    // 分配正方角色
    for (let i = 0; i < affirmativeCount && currentIndex < unassignedPlayers.length; i++) {
      const player = unassignedPlayers[currentIndex++];
      const playerIndex = newPlayers.findIndex(p => p.id === player.id);
      newPlayers[playerIndex] = { ...player, role: `affirmative${i + 1}` as DebateRole };
    }

    // 分配反方角色
    for (let i = 0; i < negativeCount && currentIndex < unassignedPlayers.length; i++) {
      const player = unassignedPlayers[currentIndex++];
      const playerIndex = newPlayers.findIndex(p => p.id === player.id);
      newPlayers[playerIndex] = { ...player, role: `negative${i + 1}` as DebateRole };
    }

    // 分配裁判角色
    for (let i = 0; i < judgeCount && currentIndex < unassignedPlayers.length; i++) {
      const player = unassignedPlayers[currentIndex++];
      const playerIndex = newPlayers.findIndex(p => p.id === player.id);
      newPlayers[playerIndex] = { ...player, role: 'judge' };
    }

    // 分配计时员角色
    for (let i = 0; i < timekeeperCount && currentIndex < unassignedPlayers.length; i++) {
      const player = unassignedPlayers[currentIndex++];
      const playerIndex = newPlayers.findIndex(p => p.id === player.id);
      newPlayers[playerIndex] = { ...player, role: 'timekeeper' };
    }

    setState(prev => ({
      ...prev,
      players: newPlayers,
    }));
  }, [state.config, state.players]);

  const resetRoles = useCallback(() => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(player => ({ ...player, role: 'unassigned' })),
    }));
  }, []);

  const getTeamPlayers = useCallback((team: 'affirmative' | 'negative') => {
    return state.players.filter(player => 
      player.role.startsWith(team)
    ).sort((a, b) => a.role.localeCompare(b.role));
  }, [state.players]);

  const getSpeakingOrder = useCallback(() => {
    const affirmativePlayers = getTeamPlayers('affirmative');
    const negativePlayers = getTeamPlayers('negative');
    
    // 按照正一、反一、正二、反二的顺序排列
    const order: Player[] = [];
    const maxSpeakers = Math.max(affirmativePlayers.length, negativePlayers.length);
    
    for (let i = 0; i < maxSpeakers; i++) {
      if (affirmativePlayers[i]) order.push(affirmativePlayers[i]);
      if (negativePlayers[i]) order.push(negativePlayers[i]);
    }
    
    return order;
  }, [getTeamPlayers]);

  const getAssignedCount = useCallback(() => {
    const affirmative = state.players.filter(p => p.role.startsWith('affirmative')).length;
    const negative = state.players.filter(p => p.role.startsWith('negative')).length;
    const judges = state.players.filter(p => p.role === 'judge').length;
    const timekeepers = state.players.filter(p => p.role === 'timekeeper').length;

    const assigned = affirmative + negative + judges + timekeepers;
    const total = state.players.length;
    const required = {
      affirmative: state.config.affirmativeCount,
      negative: state.config.negativeCount,
      judges: state.config.judgeCount,
      timekeepers: state.config.timekeeperCount,
      total: state.config.affirmativeCount + state.config.negativeCount + 
             state.config.judgeCount + state.config.timekeeperCount
    };

    const isComplete = 
      affirmative >= required.affirmative &&
      negative >= required.negative &&
      judges >= required.judges &&
      timekeepers >= required.timekeepers;

    return { 
      assigned,
      total,
      required,
      isComplete,
      counts: {
        affirmative,
        negative,
        judges,
        timekeepers
      }
    };
  }, [state.players, state.config]);

  return {
    players: state.players,
    config: state.config,
    assignRole,
    updatePlayer,
    addPlayer,
    removePlayer,
    autoAssignRoles,
    resetRoles,
    getTeamPlayers,
    getSpeakingOrder,
    getAssignedCount,
  };
}; 