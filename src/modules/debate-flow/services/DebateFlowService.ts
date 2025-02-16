import { EventEmitter } from 'events';
import type {
  IDebateFlow,
  DebateFlowConfig,
  DebateFlowState,
  SpeechInput,
  StateChangeHandler,
  SpeakingOrderInfo,
  PlayerConfig,
  SpeakerInfo,
  SpeakerStatus
} from '../types/interfaces';
import { DebateStatus } from '../types/interfaces';
import { LLMService } from './LLMService';
import { SpeakingOrderManager } from './SpeakingOrderManager';
import { SpeechProcessor } from './SpeechProcessor';
import { ScoringSystem } from './ScoringSystem';
import { DebateFlowEvent } from '../types/events';

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
      status: DebateStatus.PREPARING,
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
      status: DebateStatus.PREPARING,
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
    
    // 保存之前的状态
    this.previousState = { ...this.state };
    
    try {
      if (this.state.status !== DebateStatus.PREPARING) {
        throw new Error('辩论已经开始');
      }

      // 设置第一个发言者
      const firstSpeaker = this.state.speakingOrder.speakers[0]?.player;
      const secondSpeaker = this.state.speakingOrder.speakers[1]?.player;

      if (!firstSpeaker) {
        throw new Error('没有可用的发言者');
      }

      // 更新状态
      this.state = {
        ...this.state,
        status: DebateStatus.ONGOING,
        currentSpeaker: firstSpeaker,
        nextSpeaker: secondSpeaker,
        currentRound: 1,
        currentSpeech: null
      };

      // 触发状态更新
      this.emitStateChange();
      
      console.log('辩论开始成功，当前状态:', this.state.status);
    } catch (error) {
      // 发生错误时恢复之前的状态
      if (this.previousState) {
        this.state = this.previousState;
        this.emitStateChange();
      }
      console.error('开始辩论失败:', error);
      throw error;
    }
  }

  async pauseDebate(): Promise<void> {
    if (this.state.status !== DebateStatus.ONGOING) {
      throw new Error('辩论未在进行中');
    }

    this.state = {
      ...this.state,
      status: DebateStatus.PAUSED
    };

    this.emitStateChange();
  }

  async resumeDebate(): Promise<void> {
    if (this.state.status !== DebateStatus.PAUSED) {
      throw new Error('辩论未处于暂停状态');
    }

    this.state = {
      ...this.state,
      status: DebateStatus.ONGOING
    };

    this.emitStateChange();
  }

  async endDebate(): Promise<void> {
    this.state = {
      ...this.state,
      status: DebateStatus.COMPLETED
    };

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
    const pendingSpeaker = speakingOrder.speakers.find(s => s.status === 'waiting');
    return pendingSpeaker ? pendingSpeaker.player : null;
  }

  private async moveToNextSpeaker(): Promise<void> {
    console.log('开始切换下一个发言者');
    
    // 如果没有下一个发言者，检查是否需要进入下一轮
    if (!this.state.nextSpeaker) {
      console.log('当前轮次所有发言者已完成');
      
      // 更新状态为等待评分
      this.state = {
        ...this.state,
        status: DebateStatus.ROUND_COMPLETE,
        currentSpeaker: null,
        nextSpeaker: null
      };
      
      this.emitStateChange();
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
      this.state.speakingOrder.speakers[currentSpeakerIndex].status = 'finished';
      
      // 找到下一个待发言的人
      const nextSpeakerInfo = this.state.speakingOrder.speakers.find(s => s.status === 'waiting');
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
      currentSpeech: this.state.currentSpeech ? { ...this.state.currentSpeech } : null
    };
    
    console.log('状态更新:', {
      status: newState.status,
      currentSpeaker: newState.currentSpeaker?.name,
      nextSpeaker: newState.nextSpeaker?.name,
      round: newState.currentRound
    });
    
    this.eventEmitter.emit('stateChange', newState);
  }

  async skipCurrentSpeaker(): Promise<void> {
    if (!this.state.currentSpeaker) {
      throw new Error('没有正在发言的选手');
    }


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

  // 添加开始评分的方法
  async startScoring(): Promise<void> {
    if (this.state.status !== DebateStatus.ROUND_COMPLETE) {
      throw new Error('当前状态不允许开始评分');
    }

    this.state = {
      ...this.state,
      status: DebateStatus.SCORING
    };
    
    this.emitStateChange();

    try {
      // 获取当前轮次的所有发言
      const roundSpeeches = this.state.speeches.filter(
        speech => speech.round === this.state.currentRound && speech.type === 'speech'
      );

      console.log(`开始为第 ${this.state.currentRound} 轮的 ${roundSpeeches.length} 条发言生成评分`);

      // 生成评分
      const roundScores = await Promise.all(
        roundSpeeches.map(async speech => {
          console.log(`正在为发言 ${speech.id} 生成评分`);
          
          const processedSpeech = {
            ...speech,
            metadata: {
              wordCount: speech.content.split(/\s+/).length
            }
          };
          
          return await this.scoringSystem.generateScore(processedSpeech, {
            judge: {
              id: 'system_judge',
              name: '系统评委',
              characterConfig: {
                id: 'system_judge_character',
                personality: '公正严谨',
                speakingStyle: '专业客观',
                background: '专业辩论评委',
                values: ['公平', '客观'],
                argumentationStyle: '逻辑分析'
              }
            },
            rules: {
              dimensions: [
                {
                  name: 'logic',
                  weight: 0.3,
                  description: '逻辑性',
                  criteria: ['论证清晰', '结构完整', '推理严谨']
                },
                {
                  name: 'evidence',
                  weight: 0.3,
                  description: '论据充分性',
                  criteria: ['证据充分', '例证恰当', '数据准确']
                },
                {
                  name: 'delivery',
                  weight: 0.2,
                  description: '表达效果',
                  criteria: ['语言流畅', '表达清晰', '感染力强']
                },
                {
                  name: 'rebuttal',
                  weight: 0.2,
                  description: '反驳质量',
                  criteria: ['针对性强', '反驳有力', '立场一致']
                }
              ]
            },
            previousScores: this.state.scores
          });
        })
      );

      console.log(`成功生成 ${roundScores.length} 条评分`);

      // 更新状态中的评分
      this.state = {
        ...this.state,
        scores: [...this.state.scores, ...roundScores]
      };
      
      // 触发评分完成事件
      this.eventEmitter.emit(DebateFlowEvent.ROUND_SCORED, {
        round: this.state.currentRound,
        scores: roundScores
      });

      // 检查是否需要进入下一轮
      if (this.state.currentRound < this.state.totalRounds) {
        console.log(`开始第 ${this.state.currentRound + 1} 轮`);
        
        // 开始新的轮次
        this.state = {
          ...this.state,
          currentRound: this.state.currentRound + 1,
          status: DebateStatus.ONGOING,
          speakingOrder: this.speakingOrderManager.initializeOrder(
            this.state.speakingOrder.speakers.map(s => s.player),
            this.state.speakingOrder.format
          ),
          currentSpeaker: null,
          nextSpeaker: null
        };
        
        // 设置下一个发言者
        this.state.nextSpeaker = this.speakingOrderManager.getNextSpeaker(
          this.state.speakingOrder
        );
      } else {
        console.log('所有轮次已完成，结束辩论');
        
        // 辩论结束
        this.state = {
          ...this.state,
          status: DebateStatus.COMPLETED
        };
      }

      this.emitStateChange();
    } catch (error) {
      console.error('评分过程出错:', error);
      throw error;
    }
  }

  // 添加开始新一轮的方法
  async startNextRound(): Promise<void> {
    console.log('开始新一轮:', {
      currentRound: this.state.currentRound,
      totalRounds: this.state.totalRounds,
      status: this.state.status
    });

    // 1. 验证当前状态
    if (this.state.status !== DebateStatus.SCORING && this.state.status !== DebateStatus.ROUND_COMPLETE) {
      console.error('当前状态不允许开始新一轮:', this.state.status);
      throw new Error('当前状态不允许开始新一轮');
    }

    // 2. 检查是否可以进入下一轮
    if (this.state.currentRound >= this.state.totalRounds) {
      console.log('所有轮次已完成');
      this.state = {
        ...this.state,
        status: DebateStatus.COMPLETED
      };
      this.emitStateChange();
      return;
    }

    // 3. 重置所有发言者状态
    const resetSpeakers = this.state.speakingOrder.speakers.map(speaker => ({
      ...speaker,
      status: 'waiting' as const
    }));

    // 4. 更新状态
    this.state = {
      ...this.state,
      currentRound: this.state.currentRound + 1,
      status: DebateStatus.ONGOING,
      currentSpeaker: null,
      nextSpeaker: resetSpeakers[0]?.player || null,
      speakingOrder: {
        ...this.state.speakingOrder,
        speakers: resetSpeakers,
        currentRound: this.state.currentRound + 1
      }
    };

    console.log('新一轮状态初始化完成:', {
      round: this.state.currentRound,
      status: this.state.status,
      nextSpeaker: this.state.nextSpeaker?.name,
      speakersCount: resetSpeakers.length,
      speakersStatus: resetSpeakers.map(s => ({
        name: s.player.name,
        status: s.status
      }))
    });

    // 5. 确保发出状态变更事件
    this.emitStateChange();
    
    // 6. 如果有下一个发言者，自动开始第一个发言
    if (this.state.nextSpeaker) {
      await this.moveToNextSpeaker();
    }
  }
} 