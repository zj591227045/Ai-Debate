import { useState, useCallback } from 'react';
import { Player, DebateRole } from '../types/player';
import { shuffleArray } from '../utils/array';

export interface RoleAssignmentConfig {
  affirmativeCount: number;
  negativeCount: number;
  judgeCount: number;
  timekeeperCount: number;
  minPlayers: number;
  maxPlayers: number;
  autoAssign?: boolean;
}

interface RoleAssignmentState {
  players: Player[];
  config: RoleAssignmentConfig;
}

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

  const selectCharacter = useCallback((playerId: string, characterId: string) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(player =>
        player.id === playerId ? { ...player, characterId } : player
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
    const { affirmativeCount, negativeCount } = state.config;
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

  const getAssignedCount = useCallback(() => {
    const affirmative = state.players.filter(p => p.role.startsWith('affirmative')).length;
    const negative = state.players.filter(p => p.role.startsWith('negative')).length;

    return {
      affirmative,
      negative,
      total: state.players.length,
      isBalanced: affirmative === negative,
    };
  }, [state.players]);

  return {
    players: state.players,
    config: state.config,
    assignRole,
    updatePlayer,
    selectCharacter,
    addPlayer,
    removePlayer,
    autoAssignRoles,
    resetRoles,
    getAssignedCount,
  };
}; 