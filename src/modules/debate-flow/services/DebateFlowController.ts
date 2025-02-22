import { EventEmitter } from 'events';
import type { Player, DebateConfig } from '@game-config/types';
import type { Speech } from '../types/interfaces';
import { DebateFlowController as IDebateFlowController } from '../types/controller';
import type {
  DebateFlowState,
  SpeakingOrder,
  SpeakerInfo,
  Score,
  ProcessedSpeech
} from '../types/interfaces';
import { DebateFlowEvent } from '../types/events';
import { DebateFlowError, DebateFlowException } from '../types/errors';
import { SpeakingOrderManager } from './SpeakingOrderManager';
import { RoundController } from './RoundController';
import { ScoringSystem } from './ScoringSystem';
import { LLMService } from './LLMService';
import { DebateStatus } from '@state/types/adapters';

export class DebateFlowController implements IDebateFlowController {
  private readonly eventEmitter: EventEmitter;
  private readonly speakingOrderManager: SpeakingOrderManager;
  private readonly roundController: RoundController;
  private readonly scoringSystem: ScoringSystem;
  private readonly llmService: LLMService;
  private state: DebateFlowState;
  private config!: DebateConfig;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.speakingOrderManager = new SpeakingOrderManager();
    this.roundController = new RoundController(this.eventEmitter);
    this.llmService = new LLMService();
    this.scoringSystem = new ScoringSystem(this.llmService);
    this.state = {
      status: DebateStatus.PREPARING,
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
      currentSpeech: null,
      speeches: [],
      scores: []
    };
  }

  async initialize(config: DebateConfig): Promise<void> {
    this.config = config;
    const speakingOrder = this.speakingOrderManager.initializeOrder(
      config.players,
      config.rules.debateFormat
    );

    this.state = {
      status: DebateStatus.PREPARING,
      currentRound: 1,
      totalRounds: config.topic.rounds,
      speakingOrder: speakingOrder as SpeakingOrder,
      currentSpeaker: null,
      nextSpeaker: this.speakingOrderManager.getNextSpeaker(speakingOrder),
      currentSpeech: null,
      speeches: [],
      scores: []
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

    this.state.status = DebateStatus.IN_PROGRESS;
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

    this.state.status = DebateStatus.PAUSED;
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

    this.state.status = DebateStatus.IN_PROGRESS;
    // 注意：目前不支持恢复流式输出，需要重新开始当前发言
    await this.startCurrentSpeech();
    this.emitStateChange();
  }

  async endDebate(): Promise<void> {
    this.state.status = DebateStatus.COMPLETED;
    this.roundController.forceEndSpeech();
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
    if (this.state.status === DebateStatus.IN_PROGRESS) {
      this.state.status = DebateStatus.PAUSED;
      this.roundController.forceEndSpeech();
    }

    // 触发保存事件，具体的保存逻辑由外部处理
    this.eventEmitter.emit(DebateFlowEvent.DEBATE_PAUSED, {
      state: this.state
    });
  }

  async submitHumanSpeech(playerId: string, content: string): Promise<void> {
    console.log('提交人类发言:', {
      playerId,
      contentLength: content.length
    });

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

    // 添加到发言历史
    const speech: Speech = {
      id: `speech_${Date.now()}`,
      playerId: currentSpeaker.id,
      content,
      type: 'speech',
      timestamp: Math.floor(Date.now() / 1000),  // 转换为秒级时间戳
      round: this.state.currentRound,
      role: 'user'  // 人类选手使用'user'角色
    };

    console.log('添加发言到历史:', speech);
    this.state.speeches.push(speech);

    // 触发发言完成事件
    this.eventEmitter.emit(DebateFlowEvent.SPEECH_ENDED, {
      player: currentSpeaker,
      type: 'speech' as const,
      content,
      state: this.state
    });

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
      console.log('当前轮次所有发言者已完成，准备生成评分...');
      
      try {
        // 当前轮次结束，先生成评分
        await this.generateRoundScores();
        console.log('评分生成完成，检查是否进入下一轮');
        
        // 检查是否还有下一轮
        if (this.state.currentRound < this.state.totalRounds) {
          console.log(`开始第 ${this.state.currentRound + 1} 轮`);
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
          
          console.log('新一轮发言顺序初始化完成', {
            currentSpeaker: this.state.currentSpeaker,
            nextSpeaker: this.state.nextSpeaker
          });
        } else {
          console.log('所有轮次已完成，结束辩论');
          // 辩论结束
          await this.endDebate();
        }
      } catch (error) {
        console.error('处理轮次结束时出错:', error);
        throw new DebateFlowException(
          DebateFlowError.INVALID_ROUND_TRANSITION,
          '处理轮次结束时出错'
        );
      }
      return;
    }

    this.state.currentSpeaker = nextSpeaker;
    this.state.nextSpeaker = this.speakingOrderManager.getNextSpeaker(
      this.state.speakingOrder
    );

    console.log('切换到下一个发言者', {
      currentSpeaker: this.state.currentSpeaker,
      nextSpeaker: this.state.nextSpeaker
    });

    await this.startCurrentSpeech();
  }

  private async startCurrentSpeech(): Promise<void> {
    const currentSpeaker = this.state.currentSpeaker;
    if (!currentSpeaker) return;

    console.log('开始当前发言:', {
      speaker: currentSpeaker.name,
      isAI: currentSpeaker.isAI
    });

    // 如果是AI选手，需要生成内心OS和正式发言
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
      this.emitStateChange();

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
      this.emitStateChange();

      await this.waitForStreamComplete(speechResponse.content);
    } else {
      // 人类选手直接进入正式发言阶段
      console.log('准备人类选手发言输入框');
      this.state.currentSpeech = {
        type: 'speech',
        content: '',
        status: 'streaming'  // 使用streaming状态表示等待人类输入
      };
      this.emitStateChange();

      // 触发人类发言事件
      this.eventEmitter.emit(DebateFlowEvent.SPEECH_STARTED, {
        player: currentSpeaker,
        type: 'speech' as const,
        state: this.state
      });
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

  private async generateRoundScores(): Promise<void> {
    try {
      console.log(`开始为第 ${this.state.currentRound} 轮生成评分`);
      
      // 获取当前轮次的所有发言
      const roundSpeeches = this.state.speeches.filter(
        speech => speech.round === this.state.currentRound
      );
      
      console.log(`找到 ${roundSpeeches.length} 条发言记录需要评分`);

      // 将 Speech 转换为 ProcessedSpeech
      const processedSpeeches: ProcessedSpeech[] = roundSpeeches.map(speech => ({
        ...speech,
        metadata: {
          wordCount: speech.content.split(/\s+/).length
        }
      }));
      
      console.log('开始生成评分...');

      if (!this.config.judge || !this.config.rules.scoring) {
        throw new DebateFlowException(
          DebateFlowError.SCORING_FAILED,
          '缺少评委或评分规则配置'
        );
      }

      // 为每个发言生成评分
      const roundScores: Score[] = await Promise.all(
        processedSpeeches.map(speech =>
          this.scoringSystem.generateScore(speech, {
            judge: this.config.judge!,
            rules: {
              dimensions: this.config.rules.scoring!.dimensions
            },
            previousScores: this.state.scores,
            topic: this.config.topic,
            currentRound: this.state.currentRound,
            totalRounds: this.state.totalRounds,
            debateRules: {
              description: this.config.rules.description
            }
          })
        )
      );

      console.log(`成功生成 ${roundScores.length} 条评分`);

      // 更新状态中的评分
      this.state.scores = [...this.state.scores, ...roundScores];
      
      // 触发评分完成事件
      this.eventEmitter.emit(DebateFlowEvent.ROUND_SCORED, {
        round: this.state.currentRound,
        scores: roundScores
      });
      
      console.log('评分已更新到状态，并触发评分完成事件');
      
      this.emitStateChange();
    } catch (error) {
      console.error('生成评分失败:', error);
      throw new DebateFlowException(
        DebateFlowError.SCORING_FAILED,
        '生成评分失败'
      );
    }
  }

  private emitStateChange(): void {
    this.eventEmitter.emit('stateChange', this.state);
  }
} 