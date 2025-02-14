import type { Player } from '@game-config/types';
import { generateStream } from '@modules/llm/api';
import type { StreamResponse } from '../types/manager';
import { DebateFlowError, DebateFlowException } from '../types/errors';
import { DebateFlowEvent, EventEmitter } from '../types/events';

export class RoundController {
  private currentStream: ReadableStream<Uint8Array> | null = null;
  private streamController: AbortController | null = null;

  constructor(
    private readonly eventEmitter: EventEmitter
  ) {}

  async startNewRound(round: number): Promise<void> {
    this.eventEmitter.emit(DebateFlowEvent.ROUND_STARTED, { round });
  }

  async startInnerThoughts(player: Player): Promise<StreamResponse> {
    if (!player.isAI) {
      throw new DebateFlowException(
        DebateFlowError.INVALID_SPEAKING_ORDER,
        '只有AI选手需要生成内心OS'
      );
    }

    try {
      this.streamController = new AbortController();
      const response = await generateStream({
        characterId: player.characterId!,
        type: 'innerThoughts',
        signal: this.streamController.signal,
        systemPrompt: `你是一位专业的辩论选手，现在需要以思考者的身份，分析当前辩论局势并思考策略。
角色信息：
- 姓名：${player.name}
- 性格：${player.personality || '未指定'}
- 说话风格：${player.speakingStyle || '未指定'}
- 专业背景：${player.background || '未指定'}
- 价值观：${player.values || '未指定'}
- 论证风格：${player.argumentationStyle || '未指定'}`
      });

      this.currentStream = response.content;
      const metadata = {
        playerId: player.id,
        type: 'innerThoughts' as const,
        startTime: Date.now(),
        status: 'streaming' as const
      };

      this.eventEmitter.emit(DebateFlowEvent.INNER_THOUGHTS_STARTED, {
        player,
        type: 'innerThoughts',
        metadata
      });

      return {
        content: response.content,
        metadata
      };
    } catch (error) {
      await this.handleAIGenerationFailure(error as Error);
      throw error;
    }
  }

  async startSpeech(player: Player): Promise<StreamResponse> {
    try {
      if (player.isAI) {
        this.streamController = new AbortController();
        const response = await generateStream({
          characterId: player.characterId!,
          type: 'speech',
          signal: this.streamController.signal,
          systemPrompt: `你是一位专业的辩论选手，现在需要基于之前的思考，生成正式的辩论发言。
角色信息：
- 姓名：${player.name}
- 性格：${player.personality || '未指定'}
- 说话风格：${player.speakingStyle || '未指定'}
- 专业背景：${player.background || '未指定'}
- 价值观：${player.values || '未指定'}
- 论证风格：${player.argumentationStyle || '未指定'}`
        });

        this.currentStream = response.content;
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
          content: response.content,
          metadata
        };
      } else {
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
    } catch (error) {
      await this.handleAIGenerationFailure(error as Error);
      throw error;
    }
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
      this.currentStream = null;
    }
  }

  async handleAIGenerationFailure(error: Error): Promise<void> {
    this.eventEmitter.emit(DebateFlowEvent.ERROR_OCCURRED, {
      error,
      type: DebateFlowError.AI_GENERATION_FAILED
    });

    // 清理当前状态
    this.forceEndSpeech();

    throw new DebateFlowException(
      DebateFlowError.AI_GENERATION_FAILED,
      error.message
    );
  }
} 