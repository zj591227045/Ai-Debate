import { EventEmitter } from 'events';
import {
  IDebateFlow,
  DebateFlowConfig,
  DebateFlowState,
  SpeechInput,
  StateChangeHandler,
  SpeakingOrderInfo,
  SpeakerInfo,
  SpeechInfo,
  PlayerConfig
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
  private previousState: DebateFlowState | null = null;

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
    console.log('初始化辩论流程:', config);
    
    const speakingOrder = this.speakingOrderManager.initializeOrder(
      config.players,
      config.rules.format
    );

    console.log('生成发言顺序:', speakingOrder);

    // 确保有发言者
    if (!speakingOrder.speakers || speakingOrder.speakers.length === 0) {
      throw new Error('没有可用的发言者');
    }

    // 设置初始状态
    this.state = {
      status: 'preparing',
      currentRound: 1,
      totalRounds: config.rules.rounds,
      currentSpeaker: null,
      nextSpeaker: speakingOrder.speakers[0]?.player || null,
      speakingOrder: {
        ...speakingOrder,
        totalRounds: config.rules.rounds
      },
      currentSpeech: null,
      speeches: [],
      scores: []
    };

    console.log('初始化状态:', this.state);
    this.emitStateChange();
  }

  async startDebate(): Promise<void> {
    console.log('开始辩论，当前状态:', this.state.status);
    
    if (this.state.status !== 'preparing') {
      throw new Error('辩论已经开始');
    }

    // 设置第一个发言者
    const firstSpeaker = this.state.speakingOrder.speakers[0]?.player;
    const secondSpeaker = this.state.speakingOrder.speakers[1]?.player;

    if (!firstSpeaker) {
      throw new Error('没有可用的发言者');
    }

    this.state = {
      ...this.state,
      status: 'ongoing',
      currentSpeaker: firstSpeaker,
      nextSpeaker: secondSpeaker
    };

    console.log('辩论开始，更新后的状态:', {
      status: this.state.status,
      currentSpeaker: this.state.currentSpeaker,
      nextSpeaker: this.state.nextSpeaker
    });

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
    console.log('提交发言:', {
      playerId: speech.playerId,
      type: speech.type,
      currentSpeaker: this.state.currentSpeaker?.id
    });

    // 处理系统消息
    if (speech.type === 'system' || speech.playerId === 'system') {
      console.log('处理系统消息:', speech);
      // 保存系统消息到历史记录
      this.state.speeches.push({
        id: `system-${Date.now()}`,
        playerId: 'system',
        content: speech.content,
        type: 'system',
        timestamp: Date.now(),
        round: this.state.currentRound,
        role: 'system'
      });
      
      this.emitStateChange();
      
      // 如果是切换发言者的消息，执行切换
      if (speech.content.includes('切换下一位发言者') || speech.content.includes('进入下一轮')) {
        await this.moveToNextSpeaker();
      }
      return;
    }

    // 检查发言权限（仅对非系统消息）
    if (!this.state.currentSpeaker || this.state.currentSpeaker.id !== speech.playerId) {
      console.error('发言权限检查失败:', {
        currentSpeaker: this.state.currentSpeaker?.id,
        attemptingSpeaker: speech.playerId
      });
      throw new Error('不是当前发言者');
    }

    // 处理普通发言
    this.state.currentSpeech = {
      type: speech.type,
      content: speech.content,
      status: 'completed'
    };

    // 保存发言到历史记录
    this.state.speeches.push({
      id: `${speech.playerId}-${speech.type}-${Date.now()}`,
      playerId: speech.playerId,
      content: speech.content,
      type: speech.type,
      timestamp: Date.now(),
      round: this.state.currentRound,
      role: speech.type === 'innerThoughts' ? 'assistant' : 'user'
    });
    
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
    console.log('开始切换下一个发言者');
    
    // 如果没有下一个发言者，检查是否需要进入下一轮
    if (!this.state.nextSpeaker) {
      console.log('没有下一个发言者，检查是否需要进入下一轮');
      if (this.state.currentRound < this.state.totalRounds) {
        // 开始新的轮次
        this.state.currentRound++;
        console.log('进入新一轮:', this.state.currentRound);
        this.state.speakingOrder = this.speakingOrderManager.initializeOrder(
          this.state.speakingOrder.speakers.map(s => s.player),
          this.state.speakingOrder.format
        );
        this.state.currentSpeaker = null;
        this.state.nextSpeaker = this.getNextSpeaker(this.state.speakingOrder);
        this.emitStateChange();
      } else {
        // 辩论结束
        console.log('所有轮次已完成，结束辩论');
        await this.endDebate();
      }
      return;
    }

    // 更新当前发言者和下一个发言者
    const prevSpeaker = this.state.currentSpeaker;
    this.state.currentSpeaker = this.state.nextSpeaker;
    
    // 更新发言顺序中的状态
    const currentSpeakerIndex = this.state.speakingOrder.speakers.findIndex(
      s => s.player.id === this.state.currentSpeaker?.id
    );
    
    if (currentSpeakerIndex !== -1) {
      // 将当前发言者标记为已完成
      this.state.speakingOrder.speakers[currentSpeakerIndex].status = 'completed';
      
      // 找到下一个待发言的人
      const nextSpeakerInfo = this.state.speakingOrder.speakers.find(s => s.status === 'pending');
      this.state.nextSpeaker = nextSpeakerInfo?.player || null;
    }
    
    console.log('发言者更新:', {
      prevSpeaker: prevSpeaker?.id,
      currentSpeaker: this.state.currentSpeaker.id,
      nextSpeaker: this.state.nextSpeaker?.id
    });

    // 只有当发言者真正改变时才触发状态更新
    if (!prevSpeaker || prevSpeaker.id !== this.state.currentSpeaker.id) {
      this.emitStateChange();
    }

    // 如果是AI发言者，处理AI发言
    if (this.state.currentSpeaker.isAI) {
      await this.handleAISpeech(this.state.currentSpeaker);
    }
  }

  private async handleAISpeech(speaker: SpeakerInfo): Promise<void> {
    // 首先生成内心独白
    const innerThoughtsGen = this.llmService.generateStream({
      systemPrompt: `你是一位专业的辩论选手，现在需要生成内心独白，分析当前局势和策略。`,
      characterId: speaker.id,
      type: 'innerThoughts'
    });

    this.state.currentSpeech = {
      type: 'innerThoughts',
      content: '',
      status: 'streaming'
    };

    for await (const chunk of innerThoughtsGen) {
      if (this.state.currentSpeech) {
        this.state.currentSpeech.content += chunk;
        this.emitStateChange();
      }
    }

    if (this.state.currentSpeech) {
      this.state.currentSpeech.status = 'completed';
      // 保存内心独白到历史记录
      this.state.speeches.push({
        id: `${speaker.id}-innerThoughts-${Date.now()}`,
        playerId: speaker.id,
        content: this.state.currentSpeech.content,
        type: 'innerThoughts',
        timestamp: Date.now(),
        round: this.state.currentRound,
        role: 'assistant'
      });
    }

    // 然后生成正式发言
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
      // 保存正式发言到历史记录
      this.state.speeches.push({
        id: `${speaker.id}-speech-${Date.now()}`,
        playerId: speaker.id,
        content: this.state.currentSpeech.content,
        type: 'speech',
        timestamp: Date.now(),
        round: this.state.currentRound,
        role: 'assistant'
      });
    }
  }

  private emitStateChange(): void {
    // 创建一个新的状态对象，避免直接引用
    const newState = {
      ...this.state,
      speakingOrder: {
        ...this.state.speakingOrder,
        speakers: this.state.speakingOrder.speakers.map(speaker => ({
          ...speaker,
          player: { ...speaker.player }
        }))
      },
      currentSpeaker: this.state.currentSpeaker ? { ...this.state.currentSpeaker } : null,
      nextSpeaker: this.state.nextSpeaker ? { ...this.state.nextSpeaker } : null,
      currentSpeech: this.state.currentSpeech ? { ...this.state.currentSpeech } : null,
      speeches: [...this.state.speeches],
      scores: [...this.state.scores]
    };
    
    // 只有当状态真正发生变化时才触发更新
    if (JSON.stringify(this.previousState) !== JSON.stringify(newState)) {
      this.previousState = newState;
      this.eventEmitter.emit('stateChange', newState);
    }
  }

  async skipCurrentSpeaker(): Promise<void> {
    if (!this.state.currentSpeaker) {
      throw new Error('没有正在发言的选手');
    }

    this.state.speakingOrder = this.speakingOrderManager.skipCurrentSpeaker(
      this.state.speakingOrder
    );

    await this.moveToNextSpeaker();
    this.emitStateChange();
  }

  async handlePlayerExit(playerId: string): Promise<void> {
    this.state.speakingOrder = this.speakingOrderManager.handlePlayerExit(
      this.state.speakingOrder,
      playerId
    );

    if (this.state.currentSpeaker?.id === playerId) {
      await this.moveToNextSpeaker();
    }

    this.emitStateChange();
  }

  async handlePlayerRejoin(player: PlayerConfig): Promise<void> {
    this.state.speakingOrder = this.speakingOrderManager.handlePlayerRejoin(
      this.state.speakingOrder,
      player
    );

    this.emitStateChange();
  }
} 