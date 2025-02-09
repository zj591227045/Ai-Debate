import { ModelProvider } from '../../llm/types/providers';
import { Message } from '../../llm/types/common';
import { ApiConfig } from '../../llm/types/config';
import { Character } from '../types/character';
import { DebateState } from '../types/debate';
import { UnifiedLLMService } from '../../llm/services/UnifiedLLMService';
import { StoreManager } from '../../store/StoreManager';

interface DebugError {
  name?: string;
  message?: string;
  stack?: string;
  cause?: unknown;
}

// 添加配置验证接口
interface ConfigValidation {
  requiresApiKey: boolean;
  requiresBaseUrl: boolean;
}

// 不同模型提供商的配置要求
const PROVIDER_CONFIG_REQUIREMENTS: Record<string, ConfigValidation> = {
  'ollama': {
    requiresApiKey: false,
    requiresBaseUrl: true
  },
  'openai': {
    requiresApiKey: true,
    requiresBaseUrl: true
  },
  'aliyun': {
    requiresApiKey: true,
    requiresBaseUrl: true
  },
  'baidu': {
    requiresApiKey: true,
    requiresBaseUrl: true
  },
  'deepseek': {
    requiresApiKey: true,
    requiresBaseUrl: true
  },
  'gemini': {
    requiresApiKey: true,
    requiresBaseUrl: true
  },
  'huggingface': {
    requiresApiKey: true,
    requiresBaseUrl: true
  },
  'localai': {
    requiresApiKey: false,
    requiresBaseUrl: true
  },
  'volcengine': {
    requiresApiKey: true,
    requiresBaseUrl: true
  },
  'xunfei': {
    requiresApiKey: true,
    requiresBaseUrl: true
  },
  'default': {
    requiresApiKey: true,
    requiresBaseUrl: true
  }
};

export class AIDebateService {
  private llmService: UnifiedLLMService;
  private storeManager: StoreManager;

  constructor() {
    this.llmService = UnifiedLLMService.getInstance();
    this.storeManager = StoreManager.getInstance();
  }

  private async getProviderForCharacter(character: Character) {
    // 1. 获取角色信息
    console.log('【URL追踪】1. 角色信息:', {
      characterId: character.id,
      characterName: character.name,
      modelId: character.config.modelId,
      characterConfig: character.config
    });

    // 2. 获取模型配置
    const modelStore = this.storeManager.getModelStore();
    const modelConfig = await modelStore.getById(character.config.modelId);
    
    console.log('【URL追踪】2. 模型配置获取结果:', {
      searchedModelId: character.config.modelId,
      found: !!modelConfig,
      rawConfig: modelConfig
    });

    if (!modelConfig) {
      console.error('【URL追踪】错误: 未找到模型配置', {
        characterId: character.id,
        characterName: character.name,
        searchedModelId: character.config.modelId,
        fullConfig: character.config
      });
      throw new Error(`未找到角色${character.name}对应的模型配置(ID: ${character.config.modelId})`);
    }

    // 3. 检查模型配置完整性
    console.log('【URL追踪】3. 模型配置详情:', {
      modelId: modelConfig.id,
      provider: modelConfig.provider,
      auth: {
        hasBaseUrl: !!modelConfig.auth.baseUrl,
        baseUrl: modelConfig.auth.baseUrl,
        hasApiKey: !!modelConfig.auth.apiKey,
        hasOrgId: !!modelConfig.auth.organizationId
      },
      parameters: modelConfig.parameters
    });
    
    // 获取提供商特定的配置要求
    const configRequirements = PROVIDER_CONFIG_REQUIREMENTS[modelConfig.provider] || PROVIDER_CONFIG_REQUIREMENTS.default;
    
    // 根据提供商要求检查配置
    const configErrors: string[] = [];
    
    if (configRequirements.requiresBaseUrl && !modelConfig.auth.baseUrl) {
      configErrors.push('缺少服务器地址');
    }
    
    if (configRequirements.requiresApiKey && !modelConfig.auth.apiKey) {
      configErrors.push('缺少API密钥');
    }
    
    if (configErrors.length > 0) {
      console.error('【URL追踪】错误: 模型配置不完整', {
        modelId: modelConfig.id,
        provider: modelConfig.provider,
        errors: configErrors,
        auth: modelConfig.auth
      });
      throw new Error(`角色${character.name}的模型配置不完整: ${configErrors.join(', ')}`);
    }

    // 4. URL 规范化
    let baseUrl = modelConfig.auth.baseUrl;
    console.log('【URL追踪】4. URL规范化开始:', {
      originalUrl: baseUrl
    });

    if (!baseUrl.startsWith('http')) {
      baseUrl = `http://${baseUrl}`;
      console.log('【URL追踪】4.1 添加协议:', {
        updatedUrl: baseUrl
      });
    }

    // 移除末尾斜杠
    baseUrl = baseUrl.replace(/\/+$/, '');
    console.log('【URL追踪】4.2 规范化URL:', {
      updatedUrl: baseUrl
    });

    // 5. 更新配置并获取 provider
    try {
      console.log('【URL追踪】5. 开始创建Provider');
      const updatedConfig = {
        ...modelConfig,
        auth: {
          ...modelConfig.auth,
          baseUrl
        }
      };
      
      const provider = await this.llmService.getInitializedProvider(updatedConfig);
      
      console.log('【URL追踪】5.1 Provider创建成功:', {
        providerType: provider.constructor.name,
        endpoint: baseUrl,
        fullUrl: new URL('api/ai', baseUrl).toString()
      });
      
      return provider;
    } catch (err) {
      const error = err as DebugError;
      console.error('【URL追踪】5.2 Provider创建失败:', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        cause: error.cause,
        endpoint: baseUrl,
        fullUrl: new URL('api/ai', baseUrl).toString(),
        providerConfig: {
          provider: modelConfig.provider,
          baseUrl: baseUrl
        }
      });
      throw error;
    }
  }

  async generateInnerThoughts(character: Character, debateState: DebateState) {
    console.log('开始生成内心OS:', {
      characterName: character.name,
      round: debateState.currentRound,
      totalSpeeches: debateState.speeches.length,
      characterConfig: {
        modelId: character.config.modelId,
        hasPersonality: !!character.personality,
        hasSpeakingStyle: !!character.speakingStyle,
        hasBackground: !!character.background
      }
    });

    try {
      const provider = await this.getProviderForCharacter(character);
      const messages = this.buildInnerThoughtsPrompt(character, debateState);
      
      console.log('准备调用AI接口:', {
        messageCount: messages.length,
        systemPromptLength: messages[0].content.length,
        userPromptLength: messages[1].content.length,
        promptDetails: {
          systemPromptPreview: messages[0].content.substring(0, 100) + '...',
          userPromptPreview: messages[1].content.substring(0, 100) + '...'
        }
      });

      const response = await provider.chat({
        message: messages[messages.length - 1].content,
        systemPrompt: messages[0].content,
        temperature: 0.8,
        maxTokens: 500
      });

      console.log('AI接口调用成功:', {
        responseLength: response.content.length,
        responsePreview: response.content.substring(0, 100) + '...'
      });

      return response.content;
    } catch (err) {
      const error = err as DebugError;
      console.error('生成内心OS失败:', {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        cause: error.cause,
        characterConfig: {
          name: character.name,
          modelId: character.config.modelId,
          hasPersonality: !!character.personality,
          hasSpeakingStyle: !!character.speakingStyle
        }
      });
      throw error;
    }
  }

  async generateSpeech(character: Character, debateState: DebateState, innerThoughts: string) {
    try {
      const provider = await this.getProviderForCharacter(character);
      const messages = this.buildSpeechPrompt(character, debateState, innerThoughts);
      
      const response = await provider.chat({
        message: messages[messages.length - 1].content,
        systemPrompt: messages[0].content,
        temperature: 0.6,
        maxTokens: 800
      });

      return response.content;
    } catch (error) {
      console.error('生成发言失败:', error);
      throw error;
    }
  }

  async generateScore(judge: Character, debateState: DebateState) {
    try {
      const provider = await this.getProviderForCharacter(judge);
      const messages = this.buildScoringPrompt(judge, debateState);
      
      const response = await provider.chat({
        message: messages[messages.length - 1].content,
        systemPrompt: messages[0].content,
        temperature: 0.3,
        maxTokens: 500
      });

      return response.content;
    } catch (error) {
      console.error('生成评分失败:', error);
      throw error;
    }
  }

  private buildInnerThoughtsPrompt(character: Character, state: DebateState): Message[] {
    return [
      {
        role: 'system',
        content: `你是一个辩论选手，角色是${character.name}。
性格：${character.personality || '未指定'}
说话风格：${character.speakingStyle || '未指定'}
专业背景：${character.background || '未指定'}
价值观：${character.values?.join('、') || '未指定'}
论证风格：${character.argumentationStyle?.join('、') || '未指定'}

请根据当前辩论状态生成内心OS。`
      },
      {
        role: 'user',
        content: `辩题：${state.topic.title}
背景：${state.topic.background}
当前回合：${state.currentRound}/${state.totalRounds}
历史发言：
${state.speeches.map(s => `[${s.playerId}]: ${s.content}`).join('\n')}`
      }
    ];
  }

  private buildSpeechPrompt(character: Character, state: DebateState, innerThoughts: string): Message[] {
    return [
      {
        role: 'system',
        content: `你是一个辩论选手，角色是${character.name}。
性格：${character.personality || '未指定'}
说话风格：${character.speakingStyle || '未指定'}
专业背景：${character.background || '未指定'}
价值观：${character.values?.join('、') || '未指定'}
论证风格：${character.argumentationStyle?.join('、') || '未指定'}

请根据内心OS生成正式发言。`
      },
      {
        role: 'user',
        content: `辩题：${state.topic.title}
背景：${state.topic.background}
当前回合：${state.currentRound}/${state.totalRounds}
内心OS：${innerThoughts}
历史发言：
${state.speeches.map(s => `[${s.playerId}]: ${s.content}`).join('\n')}`
      }
    ];
  }

  private buildScoringPrompt(judge: Character, state: DebateState): Message[] {
    return [
      {
        role: 'system',
        content: `你是辩论比赛的裁判${judge.name}。
专业背景：${judge.background || '未指定'}
评判风格：${judge.speakingStyle || '未指定'}

请对本轮辩论进行评分。评分维度包括：
1. 论证逻辑性（30分）
2. 论据充分性（30分）
3. 表达清晰度（20分）
4. 态度专业性（20分）

请按以下JSON格式输出：
{
  "dimensions": {
    "logic": number,
    "evidence": number,
    "clarity": number,
    "professionalism": number
  },
  "totalScore": number,
  "comment": string
}`
      },
      {
        role: 'user',
        content: `辩题：${state.topic.title}
背景：${state.topic.background}
本轮发言记录：
${state.speeches.map(s => `[${s.playerId}]: ${s.content}`).join('\n')}`
      }
    ];
  }
}