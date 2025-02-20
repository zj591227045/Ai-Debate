import type {
  PlayerConfig,
  SpeakingOrderInfo,
  SpeakerInfo,
  SpeakerStatus
} from '../types/interfaces';

export class SpeakingOrderManager {
  initializeOrder(
    players: Array<PlayerConfig | SpeakerInfo>,
    format: 'free' | 'structured'
  ): SpeakingOrderInfo {
    let orderedPlayers: Array<PlayerConfig | SpeakerInfo>;
    
    if (format === 'structured') {
      // 结构化辩论使用固定顺序
      orderedPlayers = this.orderByTeam(players as PlayerConfig[]);
    } else {
      // 自由辩论使用随机顺序
      orderedPlayers = this.shufflePlayers(players as PlayerConfig[]);
    }
    
    const speakers = orderedPlayers.map((player, index) => ({
      player: this.convertToSpeakerInfo(player),
      status: 'waiting' as SpeakerStatus,
      sequence: index + 1
    }));

    return {
      format,
      currentRound: 1,
      totalRounds: 1,
      speakers,
      history: []
    };
  }

  getNextSpeaker(order: SpeakingOrderInfo): SpeakerInfo | null {
    const waitingSpeakers = order.speakers.filter(s => s.status === 'waiting');
    if (!waitingSpeakers.length) {
      return null;
    }
    return waitingSpeakers[0].player;
  }

  handlePlayerExit(order: SpeakingOrderInfo, playerId: string): SpeakingOrderInfo {
    const updatedSpeakers = order.speakers.filter(s => s.player.id !== playerId);
    
    // 重新计算序列号
    updatedSpeakers.forEach((speaker, index) => {
      speaker.sequence = index + 1;
    });

    return {
      ...order,
      speakers: updatedSpeakers
    };
  }

  handlePlayerRejoin(order: SpeakingOrderInfo, player: PlayerConfig): SpeakingOrderInfo {
    // 检查玩家是否已经在列表中
    if (order.speakers.some(s => s.player.id === player.id)) {
      return order;
    }

    const updatedSpeakers = [
      ...order.speakers,
      {
        player: this.convertToSpeakerInfo(player),
        status: 'waiting' as SpeakerStatus,
        sequence: order.speakers.length + 1
      }
    ];

    return {
      ...order,
      speakers: updatedSpeakers
    };
  }

  private convertToSpeakerInfo(player: PlayerConfig | SpeakerInfo): SpeakerInfo {
    if ('characterConfig' in player) {
      return {
        id: player.id,
        name: player.name,
        isAI: player.isAI,
        role: player.role,
        team: player.team
      };
    }
    return player;
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