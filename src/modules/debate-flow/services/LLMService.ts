import { UnifiedLLMService, GenerateStreamOptions } from '../../llm/services/UnifiedLLMService';
import type { Player } from '../../game-config/types';
import type { Speech } from '@debate/types';
import { PromptService } from './PromptService';
import type { ILLMService } from '../types/interfaces';
import { 
  ProcessedSpeech, 
  ScoringContext, 
  DebateContext,
  DebateSceneType 
} from '../types/interfaces';

import { StoreManager } from '../../state/core/StoreManager';
import { LLMError, LLMErrorCode } from '../../llm/types/error';

import { CharacterConfigService } from '../../storage/services/CharacterConfigService';


interface ExtendedGenerateStreamOptions {
  characterId: string;
  type: 'innerThoughts' | 'speech';
  signal?: AbortSignal;
  systemPrompt: string;
  humanPrompt?: string;
  retryCount?: number;
  fallbackPrompts?: {
    systemPrompt: string;
    humanPrompt: string;
  };
}

export class LLMService implements ILLMService {
  private readonly llmService: UnifiedLLMService;
  private readonly promptService: PromptService;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000; // 1秒
  private readonly storeManager: StoreManager;
  private readonly characterService: CharacterConfigService;
  private initialized: boolean = false;
  private lastModelUpdateTime: number = 0;
  private readonly MODEL_UPDATE_INTERVAL: number = 1000; // 1秒的更新间隔
  private players: Player[] = [];

  constructor() {
    this.llmService = UnifiedLLMService.getInstance();
    this.promptService = new PromptService();
    this.storeManager = StoreManager.getInstance();
    this.characterService = new CharacterConfigService();
  }

  // 添加设置玩家列表的方法
  setPlayers(players: Player[]) {
    this.players = players;
    console.log('更新玩家列表:', players);
  }

  // 根据玩家ID获取角色ID的辅助方法
  private getCharacterIdByPlayerId(playerId: string, player?: Player): string {
    // 如果传入了 player 对象且包含 characterId，直接使用
    if (player?.characterId) {
      console.log('使用传入的角色ID:', {
        playerId,
        characterId: player.characterId,
        source: 'player_object'
      });
      return player.characterId;
    }

    // 否则从玩家列表中查找
    const foundPlayer = this.players.find(p => p.id === playerId);
    if (!foundPlayer?.characterId) {
      console.error('无法找到角色ID:', {
        playerId,
        playersList: this.players,
        foundPlayer
      });
      throw new LLMError(
        LLMErrorCode.MODEL_NOT_FOUND,
        'No character ID',
        new Error(`无法找到玩家 ${playerId} 对应的角色ID`)
      );
    }
    console.log('从玩家列表中找到角色ID:', {
      playerId,
      characterId: foundPlayer.characterId,
      source: 'players_list'
    });
    return foundPlayer.characterId;
  }

  // 公共初始化方法
  async initialize(characterId?: string): Promise<void> {
    const currentTime = Date.now();
    
    try {
      console.log('开始初始化LLM服务:', { characterId, currentTime, lastUpdateTime: this.lastModelUpdateTime });
      
      // 如果没有指定角色ID，且距离上次更新时间不足 MODEL_UPDATE_INTERVAL，且已经初始化过，则跳过
      if (!characterId && this.initialized && currentTime - this.lastModelUpdateTime < this.MODEL_UPDATE_INTERVAL) {
        console.log('跳过初始化：已初始化且在更新间隔内');
        return;
      }

      // 获取角色配置
      const characters = await this.characterService.getActiveCharacters();
      console.log('获取到活跃角色列表:', characters.map(c => ({ id: c.id, name: c.name })));
      
      // 根据角色ID获取对应的角色配置
      let currentCharacter = null;
      if (characterId) {
        currentCharacter = characters.find((c) => c.id === characterId);
        console.log('查找指定角色:', { characterId, found: !!currentCharacter });
      } else {
        // 如果没有指定角色ID，尝试使用第一个可用的角色
        currentCharacter = characters[0];
        console.log('使用默认角色:', { found: !!currentCharacter });
      }

      if (!currentCharacter) {
        throw new LLMError(
          LLMErrorCode.MODEL_NOT_FOUND,
          'Character not found',
          new Error(`未找到${characterId ? `指定角色 ${characterId}` : '任何可用角色'}`)
        );
      }

      if (!currentCharacter.callConfig?.direct?.modelId) {
        throw new LLMError(
          LLMErrorCode.MODEL_NOT_FOUND,
          'No model configured',
          new Error(`角色 ${currentCharacter.name} (${currentCharacter.id}) 未配置模型`)
        );
      }

      const modelId = currentCharacter.callConfig.direct.modelId;
      const modelStore = this.storeManager.getModelStore();
      const modelConfig = await modelStore.getConfigById(modelId);
      console.log('获取模型配置:', { modelId, found: !!modelConfig });

      if (!modelConfig || !modelConfig.model) {
        throw new LLMError(
          LLMErrorCode.MODEL_NOT_FOUND,
          modelId,
          new Error(`未找到模型配置: ${modelId}`)
        );
      }

      // 设置当前模型配置
      const config = {
        ...modelConfig,
        parameters: {
          temperature: modelConfig.parameters?.temperature ?? 0.7,
          maxTokens: modelConfig.parameters?.maxTokens ?? 2048,
          topP: modelConfig.parameters?.topP ?? 0.9
        },
        auth: modelConfig.auth || {
          baseUrl: '',
          apiKey: ''
        },
        isEnabled: true
      };

      await this.llmService.setModelConfig(config);
      this.initialized = true;
      this.lastModelUpdateTime = currentTime;
      
      console.log('LLM服务初始化/更新完成:', {
        characterName: currentCharacter.name,
        characterId: currentCharacter.id,
        modelName: config.name,
        modelId: config.id
      });
    } catch (error) {
      console.error('LLM服务初始化/更新失败:', error);
      this.initialized = false;
      throw error;
    }
  }

  // 私有初始化检查方法
  private async ensureInitialized(): Promise<void> {
    try {
      if (!this.initialized) {
        console.log('LLM服务未初始化，开始初始化...');
        await this.initialize();
      } else {
        console.log('LLM服务已初始化');
      }
    } catch (error) {
      console.error('LLM服务初始化检查失败:', error);
      this.initialized = false;
      throw error;
    }
  }

  // 私有更新模型方法
  private async updateModelIfNeeded(characterId: string): Promise<void> {
    const currentTime = Date.now();
    if (currentTime - this.lastModelUpdateTime >= this.MODEL_UPDATE_INTERVAL) {
      await this.initialize(characterId);
    }
  }

  private async* retryableStreamGeneration(
    options: ExtendedGenerateStreamOptions
  ): AsyncGenerator<string> {
    // 确保服务已初始化
    await this.ensureInitialized();
    
    const retryCount = options.retryCount || 0;
    
    try {
      console.group('=== LLM生成请求 ===');
      console.log('角色ID:', options.characterId);
      console.log('生成类型:', options.type);
      console.log('系统提示词:', options.systemPrompt);
      console.log('人类提示词:', options.humanPrompt);
      
      const streamOptions: GenerateStreamOptions = {
        characterId: options.characterId,
        type: options.type,
        signal: options.signal,
        systemPrompt: options.systemPrompt,
        humanPrompt: options.humanPrompt
      };

      console.log('发送到UnifiedLLMService的选项:', streamOptions);
      const response = await this.llmService.generateStream(streamOptions);
      console.log('获得响应流');
      console.groupEnd();

      const reader = response.content.getReader();
      const decoder = new TextDecoder();
      console.group('=== 处理流式响应 ===');
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log(`流式响应结束，共处理 ${chunkCount} 个数据块`);
          console.groupEnd();
          break;
        }
        chunkCount++;
        const text = decoder.decode(value);
        console.log(`处理第 ${chunkCount} 个数据块:`, {
          rawLength: value.length,
          decodedLength: text.length,
          content: text
        });
        yield text;
      }
    } catch (error: unknown) {
      console.groupEnd();
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`生成失败 (重试 ${retryCount}/${this.maxRetries}):`, errorMessage);

      if (retryCount < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        yield* this.retryableStreamGeneration({
          ...options,
          retryCount: retryCount + 1
        });
      } else if (options.fallbackPrompts) {
        console.log('使用备用提示词重试...');
        console.log('备用系统提示词:', options.fallbackPrompts.systemPrompt);
        console.log('备用人类提示词:', options.fallbackPrompts.humanPrompt);
        yield* this.retryableStreamGeneration({
          characterId: options.characterId,
          type: options.type,
          signal: options.signal,
          systemPrompt: options.fallbackPrompts.systemPrompt,
          humanPrompt: options.fallbackPrompts.humanPrompt,
          retryCount: 0
        });
      } else {
        throw new Error(`生成失败 (已重试${retryCount}次): ${errorMessage}`);
      }
    }
  }

  async *generateStream(options: {
    systemPrompt: string;
    humanPrompt?: string;
    characterId: string;
    type?: 'innerThoughts' | 'speech';
    signal?: AbortSignal;
  }): AsyncGenerator<string> {
    const fallbackPrompts = {
      systemPrompt: '你是一位辩论选手。',
      humanPrompt: '请根据当前情况进行简短的发言。'
    };

    try {
      yield* this.retryableStreamGeneration({
        characterId: options.characterId,
        type: options.type || 'speech',
        systemPrompt: options.systemPrompt,
        humanPrompt: options.humanPrompt,
        signal: options.signal,
        fallbackPrompts
      });
    } catch (error) {
      console.error('所有重试都失败:', error);
      yield options.type === 'innerThoughts'
        ? '让我思考一下这个问题...'
        : '根据目前的讨论情况，我认为...';
    }
  }

  async *generateInnerThoughts(
    player: Player,
    context: DebateContext,
    options?: Partial<GenerateStreamOptions>
  ): AsyncGenerator<string> {
    console.log('生成内心独白的玩家信息:', {
      player,
      context,
      options
    });

    await this.ensureInitialized();
    const characterId = player.characterId || '';
    await this.updateModelIfNeeded(characterId);

    const systemPrompt = this.promptService.generateInnerThoughtsSystemPrompt(player);
    const humanPrompt = this.promptService.generateInnerThoughtsHumanPrompt(context);

    console.log('生成的提示词:', {
      systemPrompt,
      humanPrompt
    });

    try {
      yield* this.generateStream({
        characterId,
        type: 'innerThoughts',
        systemPrompt,
        humanPrompt,
        signal: options?.signal
      });
    } catch (error) {
      console.error('生成内心独白失败:', error);
      // 使用备用提示词重试
      const fallbackSystemPrompt = `你是一位辩论选手，需要思考当前的辩论形势。
角色信息：${player.name}
性格：${player.personality || '理性客观'}
说话风格：${player.speakingStyle || '严谨专业'}
立场：${context.stance === 'positive' ? '正方' : '反方'}`;
      const fallbackHumanPrompt = `请以第一人称的方式，简要分析当前局势，并思考下一步策略。
辩题：${context.topic.title}
${context.topic.background ? `背景：${context.topic.background}` : ''}`;

      try {
        yield* this.generateStream({
          characterId,
          type: 'innerThoughts',
          systemPrompt: fallbackSystemPrompt,
          humanPrompt: fallbackHumanPrompt,
          signal: options?.signal
        });
      } catch (retryError) {
        console.error('使用备用提示词生成内心独白也失败:', retryError);
        throw retryError;
      }
    }
  }

  async *generateSpeech(
    player: Player,
    context: DebateContext,
    innerThoughts: string,
    options?: Partial<GenerateStreamOptions>
  ): AsyncGenerator<string> {
    console.log('生成正式发言的玩家信息:', {
      player,
      context,
      innerThoughts,
      options
    });

    await this.ensureInitialized();
    const characterId = player.characterId || '';
    await this.updateModelIfNeeded(characterId);

    const systemPrompt = this.promptService.generateSpeechSystemPrompt(player);
    const humanPrompt = this.promptService.generateSpeechHumanPrompt(context, innerThoughts);

    console.log('生成的提示词:', {
      systemPrompt,
      humanPrompt
    });

    try {
      yield* this.generateStream({
        characterId,
        type: 'speech',
        systemPrompt,
        humanPrompt,
        signal: options?.signal
      });
    } catch (error) {
      console.error('生成正式发言失败:', error);
      // 使用备用提示词重试
      const fallbackSystemPrompt = `你是一位辩论选手，需要进行正式发言。
角色信息：${player.name}
性格：${player.personality || '理性客观'}
说话风格：${player.speakingStyle || '严谨专业'}
立场：${context.stance === 'positive' ? '正方' : '反方'}`;
      const fallbackHumanPrompt = `请基于以下信息进行简短有力的论述：
辩题：${context.topic.title}
${context.topic.background ? `背景：${context.topic.background}` : ''}
我的思考：${innerThoughts}`;

      try {
        yield* this.generateStream({
          characterId,
          type: 'speech',
          systemPrompt: fallbackSystemPrompt,
          humanPrompt: fallbackHumanPrompt,
          signal: options?.signal
        });
      } catch (retryError) {
        console.error('使用备用提示词生成正式发言也失败:', retryError);
        throw retryError;
      }
    }
  }

  async *generateScore(speech: ProcessedSpeech, context: ScoringContext): AsyncGenerator<string> {
    try {
      const prompt = this.promptService.generateScoringSystemPrompt(context.judge, context.rules);
      const humanPrompt = this.promptService.generateScoringHumanPrompt(speech, context);

      const request = {
        message: humanPrompt,
        systemPrompt: prompt,
        temperature: 0.7,
        maxTokens: 2000,
        topP: 0.95,
        stream: true
      };

      let content = '';
      let currentComment = '';
      let isParsingScores = false;
      const dimensions: Record<string, number> = {};

      for await (const chunk of this.llmService.stream(request)) {
        if (chunk.content) {
          content += chunk.content;
          yield chunk.content;

          // 如果遇到"总评："，开始收集评语
          if (chunk.content.includes('总评：')) {
            isParsingScores = false;
            continue;
          }

          // 如果遇到"第三部分：维度评分"，开始解析分数
          if (chunk.content.includes('第三部分：维度评分')) {
            isParsingScores = true;
            continue;
          }

          // 如果正在解析分数，检查每一行是否包含分数
          if (isParsingScores) {
            const lines = chunk.content.split('\n');
            for (const line of lines) {
              const trimmedLine = line.trim();
              // 修改正则表达式以更准确地匹配分数行
              const scoreMatch = trimmedLine.match(/^([^：]+)：\s*(\d+)\s*$/);
              if (scoreMatch) {
                const [, dimension, scoreStr] = scoreMatch;
                const score = parseInt(scoreStr, 10);
                if (!isNaN(score) && score >= 0 && score <= 100) {
                  dimensions[dimension.trim()] = score;
                }
              }
            }
          } else {
            // 如果不在解析分数，收集评语
            currentComment += chunk.content;
          }
        }
      }

      // 在所有内容接收完成后，重新解析一次分数
      const scoreLines = content.split('\n');
      let foundScoreSection = false;
      
      for (const line of scoreLines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.includes('第三部分：维度评分')) {
          foundScoreSection = true;
          continue;
        }
        
        if (foundScoreSection) {
          const scoreMatch = trimmedLine.match(/^([^：]+)：\s*(\d+)\s*$/);
          if (scoreMatch) {
            const [, dimension, scoreStr] = scoreMatch;
            const score = parseInt(scoreStr, 10);
            if (!isNaN(score) && score >= 0 && score <= 100) {
              dimensions[dimension.trim()] = score;
            }
          }
        }
      }

      // 验证维度完整性
      const expectedDimensions = context.rules.dimensions.map(d => d.name);
      const actualDimensions = Object.keys(dimensions);
      
      console.log('期望的维度:', expectedDimensions);
      console.log('实际的维度:', actualDimensions);
      console.log('解析到的维度分数:', dimensions);

      const missingDimensions = expectedDimensions.filter(dim => !actualDimensions.includes(dim));
      if (missingDimensions.length > 0) {
        console.error('评分维度不完整:', {
          expected: expectedDimensions,
          actual: actualDimensions,
          missing: missingDimensions,
          dimensions,
          fullContent: content
        });
        throw new Error(`评分维度不完整，缺少以下维度：${missingDimensions.join(', ')}`);
      }

      return {
        type: 'success',
        value: {
          dimensions,
          comment: currentComment.trim()
        }
      };
    } catch (error) {
      console.error('评分生成失败:', error);
      throw new LLMError(LLMErrorCode.API_ERROR, '评分生成失败', error instanceof Error ? error : undefined);
    }
  }

  private getSceneType(context: DebateContext): DebateSceneType {
    if (context.currentRound === 1) {
      return DebateSceneType.OPENING;
    }
    
    const lastSpeech = context.previousSpeeches[context.previousSpeeches.length - 1];
    if (lastSpeech && lastSpeech.type === 'speech') {
      return DebateSceneType.REBUTTAL;
    }

    return DebateSceneType.DEFENSE;
  }

  private getStance(player: Player): 'positive' | 'negative' {
    return player.team === 'affirmative' ? 'positive' : 'negative';
  }
}
