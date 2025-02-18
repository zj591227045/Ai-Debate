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
import type { ModelConfig } from '../../model/types/config';
import { StoreManager } from '../../state/core/StoreManager';
import { LLMError, LLMErrorCode } from '../../llm/types/error';
import type { CharacterConfig } from '../../character/types/character';
import { CharacterConfigService } from '../../storage/services/CharacterConfigService';
import type { ChatRequest, ChatResponse } from '../../llm/api/types';

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

  private async initialize(characterId?: string): Promise<void> {
    const currentTime = Date.now();
    // 如果没有指定角色ID，且距离上次更新时间不足 MODEL_UPDATE_INTERVAL，且已经初始化过，则跳过
    if (!characterId && this.initialized && currentTime - this.lastModelUpdateTime < this.MODEL_UPDATE_INTERVAL) {
      return;
    }

    try {
      // 获取角色配置
      const characters = await this.characterService.getActiveCharacters();
      
      // 根据角色ID获取对应的角色配置
      const currentCharacter = characterId 
        ? characters.find((c: CharacterConfig) => c.id === characterId)
        : null;

      if (!currentCharacter || !currentCharacter.callConfig?.direct?.modelId) {
        throw new LLMError(
          LLMErrorCode.MODEL_NOT_FOUND,
          'No model selected',
          new Error(`未找到角色 ${characterId || '默认'} 的模型配置`)
        );
      }

      const modelId = currentCharacter.callConfig.direct.modelId;
      const modelStore = this.storeManager.getModelStore();
      const modelConfig = await modelStore.getConfigById(modelId);

      if (!modelConfig || !modelConfig.model) {
        throw new LLMError(
          LLMErrorCode.MODEL_NOT_FOUND,
          modelId,
          new Error(`未找到模型配置: ${modelId}`)
        );
      }

      // 设置当前模型配置
      const config: ModelConfig = {
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
      
      console.log('LLM服务初始化/更新完成，当前模型:', config.name, '模型ID:', config.id, '来自角色:', currentCharacter.name);
    } catch (error) {
      console.error('LLM服务初始化/更新失败:', error);
      throw error;
    }
  }

  private async* retryableStreamGeneration(
    options: ExtendedGenerateStreamOptions
  ): AsyncGenerator<string> {
    // 确保服务已初始化
    await this.initialize();
    
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
      playerId: player.id,
      characterId: player.characterId,
      name: player.name
    });
    
    // 从玩家对象或玩家列表中获取角色ID
    const characterId = this.getCharacterIdByPlayerId(player.id, player);
    
    // 确保使用当前角色的模型配置
    await this.initialize(characterId);
    
    console.group('=== 生成内心OS ===');
    console.log('玩家信息:', {
      id: player.id,
      name: player.name,
      team: player.team,
      characterId,
      personality: player.personality,
      speakingStyle: player.speakingStyle,
      background: player.background,
      values: player.values,
      argumentationStyle: player.argumentationStyle
    });
    console.log('辩论上下文:', {
      topic: context.topic,
      currentRound: context.currentRound,
      totalRounds: context.totalRounds,
      sceneType: context.sceneType,
      stance: context.stance,
      previousSpeechesCount: context.previousSpeeches.length
    });

    if (!context.sceneType) {
      context.sceneType = this.getSceneType(context);
      console.log('设置场景类型:', context.sceneType);
    }
    if (!context.stance) {
      context.stance = this.getStance(player);
      console.log('设置立场:', context.stance);
    }

    const systemPrompt = `你是一位专业的辩论选手，现在需要你以思考者的身份，分析当前辩论局势并思考策略。

你的角色信息：
- 姓名：${player.name}
- 性格：${player.personality || '理性客观'}
- 说话风格：${player.speakingStyle || '严谨专业'}
- 专业背景：${player.background || '专业辩手'}
- 价值观：${player.values || '逻辑、真理'}
- 论证风格：${player.argumentationStyle || '循证论证'}
- 立场：${context.stance === 'positive' ? '正方' : '反方'}`;

    const humanPrompt = `当前辩论信息：
- 主题：${context.topic.title}
${context.topic.background ? `- 背景：${context.topic.background}` : ''}
- 当前轮次：${context.currentRound}/${context.totalRounds}
${context.previousSpeeches.length > 0 ? `\n已有发言：\n${context.previousSpeeches.map(speech => 
  `[${speech.playerId}]: ${speech.content}`
).join('\n')}` : ''}

请以内心独白的方式，分析当前局势并思考下一步策略。注意：
1. 保持你的性格特征和价值观
2. 分析其他选手的论点优劣
3. 思考可能的反驳方向
4. 规划下一步的论证策略`;

    console.log('生成的提示词:', {
      systemPrompt,
      humanPrompt
    });

    const fallbackPrompts = {
      systemPrompt: `你是一位辩论选手，需要思考当前的辩论形势。
角色信息：${player.name}
性格：${player.personality || '理性客观'}
说话风格：${player.speakingStyle || '严谨专业'}
立场：${context.stance === 'positive' ? '正方' : '反方'}`,
      humanPrompt: `请以第一人称的方式，简要分析当前局势，并思考下一步策略。
辩题：${context.topic.title}
${context.topic.background ? `背景：${context.topic.background}` : ''}`
    };

    try {
      yield* this.retryableStreamGeneration({
        characterId,
        type: 'innerThoughts',
        systemPrompt,
        humanPrompt,
        ...options,
        fallbackPrompts
      });
    } catch (error) {
      console.error('生成内心OS失败:', error);
      yield '让我仔细思考一下当前的局势...';
    } finally {
      console.groupEnd();
    }
  }

  async *generateSpeech(
    player: Player,
    context: DebateContext,
    innerThoughts: string,
    options?: Partial<GenerateStreamOptions>
  ): AsyncGenerator<string> {
    console.log('生成正式发言的玩家信息:', {
      playerId: player.id,
      characterId: player.characterId,
      name: player.name
    });
    
    // 从玩家对象或玩家列表中获取角色ID
    const characterId = this.getCharacterIdByPlayerId(player.id, player);
    
    // 确保使用当前角色的模型配置
    await this.initialize(characterId);
    
    console.group('=== 生成正式发言 ===');
    console.log('玩家信息:', {
      id: player.id,
      name: player.name,
      team: player.team,
      characterId,
      personality: player.personality,
      speakingStyle: player.speakingStyle,
      background: player.background,
      values: player.values,
      argumentationStyle: player.argumentationStyle
    });
    console.log('辩论上下文:', {
      topic: context.topic,
      currentRound: context.currentRound,
      totalRounds: context.totalRounds,
      sceneType: context.sceneType,
      stance: context.stance,
      previousSpeechesCount: context.previousSpeeches.length
    });
    console.log('内心OS:', innerThoughts);

    if (!context.sceneType) {
      context.sceneType = this.getSceneType(context);
      console.log('设置场景类型:', context.sceneType);
    }
    if (!context.stance) {
      context.stance = this.getStance(player);
      console.log('设置立场:', context.stance);
    }

    const systemPrompt = `你是一位专业的辩论选手，现在需要你基于之前的思考，生成正式的辩论发言。

你的角色信息：
- 姓名：${player.name}
- 性格：${player.personality || '理性客观'}
- 说话风格：${player.speakingStyle || '严谨专业'}
- 专业背景：${player.background || '专业辩手'}
- 价值观：${player.values || '逻辑、真理'}
- 论证风格：${player.argumentationStyle || '循证论证'}
- 立场：${context.stance === 'positive' ? '正方' : '反方'}`;

    const humanPrompt = `当前辩论信息：
- 主题：${context.topic.title}
${context.topic.background ? `- 背景：${context.topic.background}` : ''}
- 当前轮次：${context.currentRound}/${context.totalRounds}
${context.previousSpeeches.length > 0 ? `\n已有发言：\n${context.previousSpeeches.map(speech => 
  `[${speech.playerId}]: ${speech.content}`
).join('\n')}` : ''}

你的内心思考：
${innerThoughts}

请基于以上信息，生成正式的辩论发言。要求：
1. 保持你的性格特征和价值观
2. 使用你的说话风格和论证风格
3. 适当回应其他选手的观点
4. 展现你的专业背景和知识`;

    console.log('生成的提示词:', {
      systemPrompt,
      humanPrompt
    });

    const fallbackPrompts = {
      systemPrompt: `你是一位辩论选手，需要进行正式发言。
角色信息：${player.name}
性格：${player.personality || '理性客观'}
说话风格：${player.speakingStyle || '严谨专业'}
立场：${context.stance === 'positive' ? '正方' : '反方'}`,
      humanPrompt: `请基于以下信息进行简短有力的论述：
辩题：${context.topic.title}
${context.topic.background ? `背景：${context.topic.background}` : ''}
我的思考：${innerThoughts}`
    };

    try {
      yield* this.retryableStreamGeneration({
        characterId,
        type: 'speech',
        systemPrompt,
        humanPrompt,
        ...options,
        fallbackPrompts
      });
    } catch (error) {
      console.error('生成发言失败:', error);
      yield '基于当前的讨论，我认为...';
    } finally {
      console.groupEnd();
    }
  }

  private getDefaultSystemPrompt(): string {
    return `你是一位专业的辩论评委。请根据以下标准对辩手的发言进行评分：
1. 逻辑性（30分）：论证的完整性、连贯性和说服力
2. 论据支持（30分）：论据的相关性、可靠性和充分性
3. 表达能力（20分）：语言的清晰度、流畅度和感染力
4. 反驳能力（20分）：对对方论点的理解和有效反驳

请以JSON格式输出评分结果，包含以下字段：
{
  "dimensions": {
    "logic": number, // 0-100分
    "evidence": number,
    "delivery": number,
    "rebuttal": number
  },
  "feedback": {
    "strengths": string[],
    "weaknesses": string[],
    "suggestions": string[]
  },
  "comment": string
}`;
  }

  private getDefaultHumanPrompt(speech: ProcessedSpeech): string {
    return `请评分以下辩论发言：

发言内容：
${speech.content}

请根据评分标准进行评分，并提供详细的评语和建议。`;
  }

  async *generateScore(speech: ProcessedSpeech, context: ScoringContext): AsyncGenerator<string> {
    console.group('=== 生成评分 ===');
    console.log('评分输入:', { speech, context });
    
    try {
      const systemPrompt = this.promptService.generateScoringSystemPrompt(context.judge);
      const humanPrompt = this.promptService.generateScoringHumanPrompt(speech, context);

      console.log('生成的提示词:', {
        systemPrompt,
        humanPrompt
      });

      if (!systemPrompt || !humanPrompt) {
        console.error('提示词生成失败');
        throw new LLMError(
          LLMErrorCode.API_ERROR,
          '生成评分提示词失败'
        );
      }

      const request = {
        message: humanPrompt,
        systemPrompt: systemPrompt,
        temperature: 0.3,
        maxTokens: 2048,
        topP: 0.95,
        stream: true
      };

      console.log('发送评分请求:', request);

      let responseContent = '';
      for await (const chunk of this.llmService.stream(request)) {
        if (chunk.content) {
          responseContent += chunk.content;
          yield chunk.content;
        }
      }

      // 验证响应是否为有效的 JSON
      try {
        const scoreData = JSON.parse(responseContent);
        console.log('评分结果:', scoreData);
        
        if (!scoreData.dimensions || !scoreData.feedback) {
          throw new Error('评分结果格式无效');
        }
      } catch (parseError) {
        console.error('评分结果解析失败:', parseError);
        throw new LLMError(
          LLMErrorCode.INVALID_RESPONSE,
          '评分结果格式无效',
          parseError instanceof Error ? parseError : undefined
        );
      }
    } catch (error) {
      console.error('评分生成失败:', error);
      throw new LLMError(
        LLMErrorCode.API_ERROR,
        '评分生成失败',
        error instanceof Error ? error : undefined
      );
    } finally {
      console.groupEnd();
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
