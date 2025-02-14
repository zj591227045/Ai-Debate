import { UnifiedLLMService } from '../../llm/services/UnifiedLLMService';
import type { GenerateStreamOptions } from '../../llm/types/api';
import type { Player } from '../../game-config/types';
import type { Speech } from '@debate/types';
import { PromptService, type DebateContext } from './PromptService';
import { ILLMService } from './ScoringSystem';

export class LLMService implements ILLMService {
  private llmService: UnifiedLLMService;
  private promptService: PromptService;

  constructor() {
    this.llmService = UnifiedLLMService.getInstance();
    this.promptService = new PromptService();
  }

  async *generateStream(options: GenerateStreamOptions): AsyncGenerator<string> {
    const response = await this.llmService.generateStream({
      ...options,
      characterId: options.characterId || 'default',
      type: options.type || 'speech'
    });
    yield* this.processStream(response.content);
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
  async *generateScore(
    judge: Player,
    context: DebateContext,
    speech: Speech,
    options?: GenerateStreamOptions
  ): AsyncGenerator<string> {
    const systemPrompt = this.promptService.generateScoringSystemPrompt(judge);
    const humanPrompt = this.promptService.generateScoringHumanPrompt(context, speech);

    const response = await this.llmService.generateStream({
      characterId: judge.characterId!,
      type: 'speech',
      signal: options?.signal,
      ...systemPrompt && { systemPrompt },
      ...humanPrompt && { humanPrompt }
    });

    yield* this.processStream(response.content);
  }
} 