import { UnifiedLLMService } from '../../llm/services/UnifiedLLMService';
import type { GenerateStreamOptions } from '../../llm/types/api';
import type { Player } from '../../game-config/types';
import type { Speech } from '@debate/types';
import { PromptService, type DebateContext } from './PromptService';
import type { ILLMService } from '../types/interfaces';
import type { ProcessedSpeech, ScoringContext } from '../types/interfaces';

export class LLMService implements ILLMService {
  private readonly llmService: UnifiedLLMService;
  private readonly promptService: PromptService;

  constructor() {
    this.llmService = UnifiedLLMService.getInstance();
    this.promptService = new PromptService();
  }

  async *generateStream(options: {
    systemPrompt: string;
    humanPrompt?: string;
    characterId?: string;
    type?: 'innerThoughts' | 'speech';
    signal?: AbortSignal;
  }): AsyncGenerator<string> {
    try {
      const response = await this.llmService.generateStream({
        characterId: options.characterId || 'default',
        type: options.type || 'speech',
        signal: options.signal
      });

      const reader = response.content.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value);
      }
    } catch (error) {
      console.error('LLM生成失败:', error);
      // 返回默认内容
      yield options.type === 'innerThoughts'
        ? '让我思考一下这个问题...'
        : '根据目前的讨论情况，我认为...';
    }
  }

  // 生成内心OS
  async *generateInnerThoughts(
    player: Player,
    context: DebateContext,
    options?: Partial<GenerateStreamOptions>
  ): AsyncGenerator<string> {
    const systemPrompt = this.promptService.generateInnerThoughtsSystemPrompt(player);
    const humanPrompt = this.promptService.generateInnerThoughtsHumanPrompt(context);

    const response = await this.llmService.generateStream({
      characterId: player.characterId || 'default',
      type: 'innerThoughts',
      systemPrompt,
      humanPrompt,
      ...options
    });

    yield* this.processStream(response.content);
  }

  // 生成正式发言
  async *generateSpeech(
    player: Player,
    context: DebateContext,
    innerThoughts: string,
    options?: Partial<GenerateStreamOptions>
  ): AsyncGenerator<string> {
    const systemPrompt = this.promptService.generateSpeechSystemPrompt(player);
    const humanPrompt = this.promptService.generateSpeechHumanPrompt(context, innerThoughts);

    const response = await this.llmService.generateStream({
      characterId: player.characterId || 'default',
      type: 'speech',
      systemPrompt,
      humanPrompt,
      ...options
    });

    yield* this.processStream(response.content);
  }

  // 生成评分
  async *generateScore(speech: ProcessedSpeech, context: ScoringContext): AsyncGenerator<string> {
    try {
      // 生成评分的系统提示词
      const systemPrompt = this.promptService.generateScoringSystemPrompt(context.judge);
      
      // 生成评分的人类提示词
      const humanPrompt = this.promptService.generateScoringHumanPrompt(speech, context);

      const response = await this.llmService.generateStream({
        characterId: context.judge.id,
        type: 'speech',
        signal: undefined
      });

      const reader = response.content.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value);
      }
    } catch (error) {
      console.error('评分生成失败:', error);
      // 返回默认的评分JSON
      yield JSON.stringify({
        dimensions: {
          logic: 85,
          evidence: 80,
          delivery: 75,
          rebuttal: 78
        },
        feedback: {
          strengths: ['论点清晰', '论据充分'],
          weaknesses: ['可以进一步加强论证'],
          suggestions: ['建议增加更多具体例证']
        },
        comment: '整体表现不错，论证较为充分，但仍有提升空间。'
      });
    }
  }

  private async *processStream(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield new TextDecoder().decode(value);
      }
    } finally {
      reader.releaseLock();
    }
  }
} 