import {
  PlayerConfig,
  SpeakingOrderInfo,
  SpeakerInfo,
  SpeakerStatus
} from '../types/interfaces';

export class SpeakingOrderManager {
  private speakingOrder: SpeakingOrderInfo | null = null;

  initializeOrder(players: PlayerConfig[], format: 'free' | 'structured'): SpeakingOrderInfo {
    if (!players.length) {
      throw new Error('选手列表为空');
    }

    let orderedPlayers: PlayerConfig[];
    if (format === 'free') {
      orderedPlayers = this.shufflePlayers(players);
    } else {
      orderedPlayers = this.orderByTeam(players);
    }

    this.speakingOrder = {
      format,
      currentRound: 1,
      totalRounds: 1,
      speakers: orderedPlayers.map((player, index) => ({
        player: this.playerConfigToSpeakerInfo(player),
        status: 'pending' as SpeakerStatus,
        sequence: index + 1
      })),
      history: []
    };

    return this.speakingOrder;
  }

  getNextSpeaker(order: SpeakingOrderInfo): SpeakerInfo | null {
    const pendingSpeakers = order.speakers.filter(s => s.status === 'pending');
    if (!pendingSpeakers.length) {
      return null;
    }
    return pendingSpeakers[0].player;
  }

  skipCurrentSpeaker(order: SpeakingOrderInfo): SpeakingOrderInfo {
    const currentSpeakerIndex = order.speakers.findIndex(s => s.status === 'speaking');
    if (currentSpeakerIndex === -1) {
      throw new Error('没有正在发言的选手');
    }

    const updatedSpeakers = [...order.speakers];
    updatedSpeakers[currentSpeakerIndex] = {
      ...updatedSpeakers[currentSpeakerIndex],
      status: 'skipped' as SpeakerStatus
    };

    return {
      ...order,
      speakers: updatedSpeakers
    };
  }

  handlePlayerExit(order: SpeakingOrderInfo, playerId: string): SpeakingOrderInfo {
    const playerIndex = order.speakers.findIndex(s => s.player.id === playerId);
    if (playerIndex === -1) {
      throw new Error('选手未找到');
    }

    const updatedSpeakers = [...order.speakers];
    if (updatedSpeakers[playerIndex].status === 'speaking') {
      updatedSpeakers[playerIndex] = {
        ...updatedSpeakers[playerIndex],
        status: 'skipped' as SpeakerStatus
      };
    } else if (updatedSpeakers[playerIndex].status === 'pending') {
      updatedSpeakers.splice(playerIndex, 1);
      for (let i = playerIndex; i < updatedSpeakers.length; i++) {
        updatedSpeakers[i] = {
          ...updatedSpeakers[i],
          sequence: i + 1
        };
      }
    }

    return {
      ...order,
      speakers: updatedSpeakers
    };
  }

  handlePlayerRejoin(order: SpeakingOrderInfo, player: PlayerConfig): SpeakingOrderInfo {
    if (order.speakers.some(s => s.player.id === player.id)) {
      throw new Error('选手已在发言列表中');
    }

    const updatedSpeakers = [...order.speakers, {
      player: this.playerConfigToSpeakerInfo(player),
      status: 'pending' as SpeakerStatus,
      sequence: order.speakers.length + 1
    }];

    return {
      ...order,
      speakers: updatedSpeakers
    };
  }

  private playerConfigToSpeakerInfo(player: PlayerConfig): SpeakerInfo {
    return {
      id: player.id,
      name: player.name,
      isAI: player.isAI,
      role: player.role,
      team: player.team
    };
  }

  private shufflePlayers(players: PlayerConfig[]): PlayerConfig[] {
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private orderByTeam(players: PlayerConfig[]): PlayerConfig[] {
    const affirmative = players.filter(p => p.team === 'affirmative');
    const negative = players.filter(p => p.team === 'negative');

    const orderByNumber = (a: PlayerConfig, b: PlayerConfig) => {
      const aNum = parseInt(a.role.match(/\d+/)?.[0] || '0');
      const bNum = parseInt(b.role.match(/\d+/)?.[0] || '0');
      return aNum - bNum;
    };

    affirmative.sort(orderByNumber);
    negative.sort(orderByNumber);

    const ordered: PlayerConfig[] = [];
    const maxLength = Math.max(affirmative.length, negative.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (affirmative[i]) ordered.push(affirmative[i]);
      if (negative[i]) ordered.push(negative[i]);
    }

    return ordered;
  }
} 