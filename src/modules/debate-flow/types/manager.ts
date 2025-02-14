import type { Player } from '@game-config/types';
import { SpeakingOrder } from './state';

export interface SpeakingOrderManager {
  // 初始化发言顺序
  initializeOrder(players: Player[], format: 'free' | 'structured'): SpeakingOrder;
  
  // 获取下一个发言者
  getNextSpeaker(currentOrder: SpeakingOrder): Player | null;
  
  // 跳过当前发言者
  skipCurrentSpeaker(order: SpeakingOrder): SpeakingOrder;
  
  // 处理选手退出
  handlePlayerExit(order: SpeakingOrder, playerId: string): SpeakingOrder;
  
  // 处理选手重新加入
  handlePlayerRejoin(order: SpeakingOrder, player: Player): SpeakingOrder;
}

export interface StreamResponse {
  content: ReadableStream<Uint8Array>;
  metadata: {
    playerId: string;
    type: 'innerThoughts' | 'speech';
    startTime: number;
    status: 'streaming' | 'completed' | 'failed';
  };
}

export interface RoundController {
  // 开始新轮次
  startNewRound(round: number): Promise<void>;
  
  // 开始内心OS阶段（仅AI选手）
  startInnerThoughts(player: Player): Promise<StreamResponse>;
  
  // 开始正式发言阶段
  startSpeech(player: Player): Promise<StreamResponse>;
  
  // 暂停当前发言
  pauseSpeech(): void;
  
  // 继续当前发言
  resumeSpeech(): void;
  
  // 强制结束当前发言
  forceEndSpeech(): void;
  
  // 处理AI生成失败
  handleAIGenerationFailure(error: Error): Promise<void>;
} 