import { EventEmitter } from 'events';
import {
  IDebateFlow,
  DebateFlowConfig,
  DebateFlowState,
  SpeechInput,
  StateChangeHandler,
  SpeakingOrderInfo,
  SpeakerInfo,
  SpeechInfo
} from '../types/interfaces';
import { LLMService } from './LLMService';
import { SpeakingOrderManager } from './SpeakingOrderManager';
import { SpeechProcessor } from './SpeechProcessor';
import { ScoringSystem } from './ScoringSystem';

export class DebateFlowService implements IDebateFlow {
  private readonly eventEmitter: EventEmitter;
  private readonly llmService: LLMService;
  private readonly speakingOrderManager: SpeakingOrderManager;
  private readonly speechProcessor: SpeechProcessor;
  private readonly scoringSystem: ScoringSystem;
  private state: DebateFlowState;

  constructor(
    llmService: LLMService,
    speakingOrderManager: SpeakingOrderManager,
    speechProcessor: SpeechProcessor,
    scoringSystem: ScoringSystem
  ) {
    this.eventEmitter = new EventEmitter();
    this.llmService = llmService;
    this.speakingOrderManager = speakingOrderManager;
    this.speechProcessor = speechProcessor;
    this.scoringSystem = scoringSystem;
    
    // 初始化状态
    this.state = {
      status: 'preparing',
      currentRound: 1,
      totalRounds: 1,
      currentSpeaker: null,
      nextSpeaker: null,
      speakingOrder: {
        format: 'free',
        currentRound: 1,
        totalRounds: 1,
        speakers: [],
        history: []
      },
      currentSpeech: null,
      speeches: [],
      scores: []
    };
  }

  async initialize(config: DebateFlowConfig): Promise<void> {
    const speakingOrder = this.speakingOrderManager.initializeOrder(
      config.players,
      config.rules.format
    );

    this.state = {
      status: 'preparing',
      currentRound: 1,
      totalRounds: config.rules.rounds,
      currentSpeaker: null,
      nextSpeaker: this.getNextSpeaker(speakingOrder),
      speakingOrder: {
        ...speakingOrder,
        totalRounds: config.rules.rounds
      },
      currentSpeech: null,
      speeches: [],
      scores: []
    };

    this.emitStateChange();
  }

  async startDebate(): Promise<void> {
    if (this.state.status !== 'preparing') {
      throw new Error('辩论已经开始');
    }

    this.state.status = 'ongoing';
    await this.moveToNextSpeaker();
    this.emitStateChange();
  }

  async pauseDebate(): Promise<void> {
    if (this.state.status !== 'ongoing') {
      throw new Error('辩论未在进行中');
    }

    this.state.status = 'paused';
    this.emitStateChange();
  }

  async resumeDebate(): Promise<void> {
    if (this.state.status !== 'paused') {
      throw new Error('辩论未处于暂停状态');
    }

    this.state.status = 'ongoing';
    this.emitStateChange();
  }

  async endDebate(): Promise<void> {
    this.state.status = 'completed';
    this.emitStateChange();
  }

  async submitSpeech(speech: SpeechInput): Promise<void> {
    if (!this.state.currentSpeaker || this.state.currentSpeaker.id !== speech.playerId) {
      throw new Error('不是当前发言者');
    }

    this.state.currentSpeech = {
      type: speech.type,
      content: speech.content,
      status: 'completed'
    };

    await this.moveToNextSpeaker();
    this.emitStateChange();
  }

  getCurrentState(): DebateFlowState {
    return { ...this.state };
  }

  subscribeToStateChange(handler: StateChangeHandler): () => void {
    this.eventEmitter.on('stateChange', handler);
    return () => this.eventEmitter.off('stateChange', handler);
  }

  private getNextSpeaker(speakingOrder: SpeakingOrderInfo): SpeakerInfo | null {
    const pendingSpeaker = speakingOrder.speakers.find(s => s.status === 'pending');
    return pendingSpeaker ? pendingSpeaker.player : null;
  }

  private async moveToNextSpeaker(): Promise<void> {
    const nextSpeaker = this.getNextSpeaker(this.state.speakingOrder);
    
    if (!nextSpeaker) {
      if (this.state.currentRound < this.state.totalRounds) {
        // 开始新的轮次
        this.state.currentRound++;
        this.state.speakingOrder = this.speakingOrderManager.initializeOrder(
          this.state.speakingOrder.speakers.map(s => s.player),
          this.state.speakingOrder.format
        );
        this.state.currentSpeaker = null;
        this.state.nextSpeaker = this.getNextSpeaker(this.state.speakingOrder);
      } else {
        // 辩论结束
        await this.endDebate();
      }
      return;
    }

    this.state.currentSpeaker = nextSpeaker;
    this.state.nextSpeaker = this.getNextSpeaker(this.state.speakingOrder);

    if (nextSpeaker.isAI) {
      await this.handleAISpeech(nextSpeaker);
    }
  }

  private async handleAISpeech(speaker: SpeakerInfo): Promise<void> {
    // 生成AI发言
    const speechGen = this.llmService.generateStream({
      systemPrompt: `你是一位专业的辩论选手，现在需要生成正式的辩论发言。`,
      characterId: speaker.id,
      type: 'speech'
    });

    this.state.currentSpeech = {
      type: 'speech',
      content: '',
      status: 'streaming'
    };

    for await (const chunk of speechGen) {
      if (this.state.currentSpeech) {
        this.state.currentSpeech.content += chunk;
        this.emitStateChange();
      }
    }

    if (this.state.currentSpeech) {
      this.state.currentSpeech.status = 'completed';
    }
  }

  private emitStateChange(): void {
    this.eventEmitter.emit('stateChange', this.getCurrentState());
  }
} 