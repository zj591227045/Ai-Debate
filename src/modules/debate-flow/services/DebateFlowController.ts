import { EventEmitter } from 'events';
import type { Player, DebateConfig } from '@game-config/types';
import type { Speech } from '@debate/types';
import { DebateFlowController as IDebateFlowController } from '../types/controller';
import { DebateFlowState } from '../types/state';
import { DebateFlowEvent } from '../types/events';
import { DebateFlowError, DebateFlowException } from '../types/errors';
import { SpeakingOrderManager } from './SpeakingOrderManager';
import { RoundController } from './RoundController';

export class DebateFlowController implements IDebateFlowController {
  private readonly eventEmitter: EventEmitter;
  private readonly speakingOrderManager: SpeakingOrderManager;
  private readonly roundController: RoundController;
  private state: DebateFlowState;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.speakingOrderManager = new SpeakingOrderManager();
    this.roundController = new RoundController(this.eventEmitter);
    this.state = {
      status: 'preparing',
      currentRound: 1,
      totalRounds: 1,
      speakingOrder: {
        format: 'free',
        currentRound: 1,
        totalRounds: 1,
        speakers: [],
        history: []
      },
      currentSpeaker: null,
      nextSpeaker: null,
      currentSpeech: null
    };
  }

  async initialize(config: DebateConfig): Promise<void> {
    const speakingOrder = this.speakingOrderManager.initializeOrder(
      config.players,
      config.rules.debateFormat
    );

    this.state = {
      status: 'preparing',
      currentRound: 1,
      totalRounds: config.topic.rounds,
      speakingOrder,
      currentSpeaker: null,
      nextSpeaker: this.speakingOrderManager.getNextSpeaker(speakingOrder),
      currentSpeech: null
    };

    this.emitStateChange();
  }

  async startDebate(): Promise<void> {
    if (this.state.status !== 'preparing') {
      throw new DebateFlowException(
        DebateFlowError.INVALID_ROUND_TRANSITION,
        '辩论已经开始'
      );
    }

    this.state.status = 'ongoing';
    await this.roundController.startNewRound(this.state.currentRound);
    await this.moveToNextSpeaker();
    this.emitStateChange();
  }

  async pauseDebate(): Promise<void> {
    if (this.state.status !== 'ongoing') {
      throw new DebateFlowException(
        DebateFlowError.INVALID_ROUND_TRANSITION,
        '辩论未在进行中'
      );
    }

    this.state.status = 'paused';
    this.roundController.pauseSpeech();
    this.emitStateChange();
  }

  async resumeDebate(): Promise<void> {
    if (this.state.status !== 'paused') {
      throw new DebateFlowException(
        DebateFlowError.INVALID_ROUND_TRANSITION,
        '辩论未处于暂停状态'
      );
    }

    this.state.status = 'ongoing';
    // 注意：目前不支持恢复流式输出，需要重新开始当前发言
    await this.startCurrentSpeech();
    this.emitStateChange();
  }

  async endDebate(): Promise<void> {
    this.state.status = 'completed';
    this.roundController.forceEndSpeech();
    this.emitStateChange();
  }

  async skipCurrentSpeaker(): Promise<void> {
    if (!this.state.currentSpeaker) {
      throw new DebateFlowException(
        DebateFlowError.SPEAKER_NOT_FOUND,
        '当前没有发言者'
      );
    }

    this.state.speakingOrder = this.speakingOrderManager.skipCurrentSpeaker(
      this.state.speakingOrder
    );
    
    this.roundController.forceEndSpeech();
    await this.moveToNextSpeaker();
    this.emitStateChange();
  }

  async forceEndCurrentSpeech(): Promise<void> {
    if (!this.state.currentSpeech) {
      throw new DebateFlowException(
        DebateFlowError.INVALID_ROUND_TRANSITION,
        '当前没有进行中的发言'
      );
    }

    this.roundController.forceEndSpeech();
    this.state.currentSpeech.status = 'completed';
    await this.moveToNextSpeaker();
    this.emitStateChange();
  }

  async saveAndExit(): Promise<void> {
    // 保存当前状态
    if (this.state.status === 'ongoing') {
      this.state.status = 'paused';
      this.roundController.forceEndSpeech();
    }

    // 触发保存事件，具体的保存逻辑由外部处理
    this.eventEmitter.emit(DebateFlowEvent.DEBATE_PAUSED, {
      state: this.state
    });
  }

  async submitHumanSpeech(playerId: string, content: string): Promise<void> {
    const currentSpeaker = this.state.currentSpeaker;
    if (!currentSpeaker || currentSpeaker.id !== playerId) {
      throw new DebateFlowException(
        DebateFlowError.INVALID_SPEAKING_ORDER,
        '不是当前发言者'
      );
    }

    if (currentSpeaker.isAI) {
      throw new DebateFlowException(
        DebateFlowError.INVALID_SPEAKING_ORDER,
        'AI选手不能提交人工发言'
      );
    }

    // 更新发言状态
    this.state.currentSpeech = {
      type: 'speech',
      content,
      status: 'completed'
    };

    // 移动到下一个发言者
    await this.moveToNextSpeaker();
    this.emitStateChange();
  }

  getCurrentState(): DebateFlowState {
    return this.state;
  }

  getCurrentSpeaker(): Player | null {
    return this.state.currentSpeaker;
  }

  getSpeechHistory(): Speech[] {
    // 这里需要实现从状态中获取发言历史的逻辑
    return [];
  }

  subscribeToStateChange(handler: (state: DebateFlowState) => void): () => void {
    const wrappedHandler = () => handler(this.state);
    this.eventEmitter.on('stateChange', wrappedHandler);
    return () => this.eventEmitter.off('stateChange', wrappedHandler);
  }

  private async moveToNextSpeaker(): Promise<void> {
    const nextSpeaker = this.speakingOrderManager.getNextSpeaker(
      this.state.speakingOrder
    );

    if (!nextSpeaker) {
      // 当前轮次结束
      if (this.state.currentRound < this.state.totalRounds) {
        // 开始新的轮次
        this.state.currentRound++;
        await this.roundController.startNewRound(this.state.currentRound);
        // 重新初始化发言顺序
        this.state.speakingOrder = this.speakingOrderManager.initializeOrder(
          Object.values(this.state.speakingOrder.speakers).map(s => s.player),
          this.state.speakingOrder.format
        );
        this.state.currentSpeaker = null;
        this.state.nextSpeaker = this.speakingOrderManager.getNextSpeaker(
          this.state.speakingOrder
        );
      } else {
        // 辩论结束
        await this.endDebate();
      }
      return;
    }

    this.state.currentSpeaker = nextSpeaker;
    this.state.nextSpeaker = this.speakingOrderManager.getNextSpeaker(
      this.state.speakingOrder
    );

    await this.startCurrentSpeech();
  }

  private async startCurrentSpeech(): Promise<void> {
    const currentSpeaker = this.state.currentSpeaker;
    if (!currentSpeaker) return;

    if (currentSpeaker.isAI) {
      // AI选手先生成内心OS
      const innerThoughtsResponse = await this.roundController.startInnerThoughts(
        currentSpeaker
      );
      this.state.currentSpeech = {
        type: 'innerThoughts',
        content: '',
        status: 'streaming'
      };

      // 等待内心OS完成后开始正式发言
      await this.waitForStreamComplete(innerThoughtsResponse.content);
      const speechResponse = await this.roundController.startSpeech(
        currentSpeaker
      );
      this.state.currentSpeech = {
        type: 'speech',
        content: '',
        status: 'streaming'
      };

      await this.waitForStreamComplete(speechResponse.content);
    } else {
      // 人类选手直接进入发言状态
      this.state.currentSpeech = {
        type: 'speech',
        content: '',
        status: 'streaming'
      };
    }
  }

  private async waitForStreamComplete(stream: ReadableStream): Promise<void> {
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        if (this.state.currentSpeech) {
          this.state.currentSpeech.content += value;
          this.emitStateChange();
        }
      }
      
      if (this.state.currentSpeech) {
        this.state.currentSpeech.status = 'completed';
      }
    } finally {
      reader.releaseLock();
    }
  }

  private emitStateChange(): void {
    this.eventEmitter.emit('stateChange', this.state);
  }
} 