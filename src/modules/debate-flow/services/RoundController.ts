import type { Player } from '@game-config/types';
import { generateStream } from '@modules/llm/api';
import type { StreamResponse } from '../types/manager';
import { DebateFlowError, DebateFlowException } from '../types/errors';
import { DebateFlowEvent, EventEmitter } from '../types/events';
import { PromptService } from './PromptService';
import { DebateContext, DebateSceneType } from '../types/interfaces';

export class RoundController {
  private currentStream: ReadableStream<Uint8Array> | null = null;
  private streamController: AbortController | null = null;
  private readonly promptService: PromptService;
  private currentContext: DebateContext;
  private retryCount: number = 0;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000; // 1秒

  constructor(
    private readonly eventEmitter: EventEmitter
  ) {
    this.promptService = new PromptService();
    this.currentContext = {
      topic: {
        title: '',
        background: ''
      },
      currentRound: 1,
      totalRounds: 1,
      previousSpeeches: [],
      sceneType: DebateSceneType.OPENING,
      stance: 'positive'
    };
  }

  setContext(context: DebateContext): void {
    this.currentContext = context;
  }

  async startNewRound(round: number): Promise<void> {
    this.retryCount = 0;
    this.eventEmitter.emit(DebateFlowEvent.ROUND_STARTED, { round });
  }

  private async handleStreamGeneration(
    player: Player,
    type: 'innerThoughts' | 'speech',
    options: {
      systemPrompt: string;
      humanPrompt: string;
      previousContent?: string;
    }
  ): Promise<StreamResponse> {
    try {
      this.streamController = new AbortController();

      const response = await generateStream({
        characterId: player.characterId!,
        type,
        signal: this.streamController.signal,
        systemPrompt: options.systemPrompt,
        humanPrompt: options.humanPrompt
      });

      this.currentStream = response.content;
      const metadata = {
        playerId: player.id,
        type,
        startTime: Date.now(),
        status: 'streaming' as const
      };

      // 发送开始事件
      const eventType = type === 'innerThoughts' 
        ? DebateFlowEvent.INNER_THOUGHTS_STARTED 
        : DebateFlowEvent.SPEECH_STARTED;

      this.eventEmitter.emit(eventType, {
        player,
        type,
        metadata
      });

      return {
        content: response.content,
        metadata
      };
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`尝试第 ${this.retryCount} 次重试...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.handleStreamGeneration(player, type, options);
      }
      
      // 如果重试次数用完，尝试使用备用提示词
      if (this.retryCount === this.maxRetries) {
        console.log('使用备用提示词重试...');
        const fallbackPrompt = this.generateFallbackPrompt(type, player);
        return this.handleStreamGeneration(player, type, {
          ...options,
          systemPrompt: fallbackPrompt.systemPrompt,
          humanPrompt: fallbackPrompt.humanPrompt
        });
      }

      // 所有重试都失败，抛出错误
      await this.handleAIGenerationFailure(error as Error);
      throw error;
    }
  }

  private generateFallbackPrompt(type: 'innerThoughts' | 'speech', player: Player): { systemPrompt: string; humanPrompt: string } {
    if (type === 'innerThoughts') {
      return {
        systemPrompt: `你是一位辩论选手，需要思考当前的辩论形势。`,
        humanPrompt: `请以第一人称的方式，简要分析当前局势，并思考下一步策略。`
      };
    } else {
      return {
        systemPrompt: `你是一位辩论选手，需要进行正式发言。`,
        humanPrompt: `请基于当前辩题，进行简短有力的论述。`
      };
    }
  }

  async startInnerThoughts(player: Player): Promise<StreamResponse> {
    if (!player.isAI) {
      throw new DebateFlowException(
        DebateFlowError.INVALID_SPEAKING_ORDER,
        '只有AI选手需要生成内心OS'
      );
    }

    const { systemPrompt, humanPrompt } = this.promptService.generatePrompt(
      player,
      this.currentContext
    );

    return this.handleStreamGeneration(player, 'innerThoughts', {
      systemPrompt,
      humanPrompt
    });
  }

  async startSpeech(player: Player, innerThoughts?: string): Promise<StreamResponse> {
    if (!player.isAI) {
      // 人类选手不需要生成内容，返回一个空的流
      const metadata = {
        playerId: player.id,
        type: 'speech' as const,
        startTime: Date.now(),
        status: 'streaming' as const
      };

      this.eventEmitter.emit(DebateFlowEvent.SPEECH_STARTED, {
        player,
        type: 'speech',
        metadata
      });

      return {
        content: new ReadableStream<Uint8Array>(),
        metadata
      };
    }

    const { systemPrompt, humanPrompt } = this.promptService.generatePrompt(
      player,
      this.currentContext,
      innerThoughts
    );

    return this.handleStreamGeneration(player, 'speech', {
      systemPrompt,
      humanPrompt,
      previousContent: innerThoughts
    });
  }

  pauseSpeech(): void {
    if (this.streamController) {
      this.streamController.abort();
      this.streamController = null;
    }
  }

  resumeSpeech(): void {
    // 目前不支持恢复流式输出，需要重新开始
    throw new DebateFlowException(
      DebateFlowError.INVALID_ROUND_TRANSITION,
      '不支持恢复流式输出，请重新开始'
    );
  }

  forceEndSpeech(): void {
    if (this.streamController) {
      this.streamController.abort();
      this.streamController = null;
    }
    this.currentStream = null;
    this.retryCount = 0;
  }

  async handleAIGenerationFailure(error: Error): Promise<void> {
    this.eventEmitter.emit(DebateFlowEvent.ERROR_OCCURRED, {
      error,
      type: DebateFlowError.AI_GENERATION_FAILED,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    });

    // 清理当前状态
    this.forceEndSpeech();

    throw new DebateFlowException(
      DebateFlowError.AI_GENERATION_FAILED,
      `生成失败 (已重试${this.retryCount}次): ${error.message}`
    );
  }
} 