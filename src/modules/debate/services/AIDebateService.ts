import { ModelProvider } from '../../llm/types/providers';
import { Message } from '../../llm/types/common';
import { ApiConfig, ModelConfig } from '../../llm/types/config';
import { Character } from '../types/character';
import { DebateState } from '../types/debate';
import { UnifiedLLMService } from '../../llm/services/UnifiedLLMService';
import { StoreManager } from '@state/core/StoreManager';
import { Service } from 'typedi';

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

@Service()
export class AIDebateService {
  private llmService: UnifiedLLMService;
  private storeManager: StoreManager;

  constructor() {
    this.llmService = UnifiedLLMService.getInstance();
    this.storeManager = StoreManager.getInstance();
  }

  private async getProviderForCharacter(character: Character) {
    const modelStore = this.storeManager.getModelStore();
    const modelConfig = await modelStore.getById(character.config.modelId);

    if (!modelConfig) {
      throw new Error(`未找到角色 ${character.name} 的模型配置`);
    }

    // 确保配置包含所有必要字段
    const config: ModelConfig = {
      id: modelConfig.id,
      name: modelConfig.name,
      provider: modelConfig.provider,
      model: modelConfig.model || '',
      parameters: {
        temperature: modelConfig.parameters?.temperature ?? 0.7,
        maxTokens: modelConfig.parameters?.maxTokens ?? 2048,
        topP: modelConfig.parameters?.topP ?? 1.0,
        ...modelConfig.parameters
      },
      auth: {
        baseUrl: modelConfig.auth?.baseUrl || '',
        apiKey: modelConfig.auth?.apiKey || ''
      },
      isEnabled: modelConfig.isEnabled ?? true,
      createdAt: modelConfig.createdAt || Date.now(),
      updatedAt: modelConfig.updatedAt || Date.now()
    };

    // 验证配置
    const configRequirements = PROVIDER_CONFIG_REQUIREMENTS[config.provider];
    if (configRequirements) {
      const configErrors: string[] = [];
      
      if (configRequirements.requiresBaseUrl && !config.auth.baseUrl) {
        configErrors.push('缺少服务器地址');
      }
      
      if (configRequirements.requiresApiKey && !config.auth.apiKey) {
        configErrors.push('缺少API密钥');
      }
      
      if (configErrors.length > 0) {
        throw new Error(`模型配置无效: ${configErrors.join(', ')}`);
      }
    }

    // URL 规范化
    if (config.auth.baseUrl) {
      config.auth.baseUrl = config.auth.baseUrl.replace(/\/+$/, '');
    }

    try {
      return await this.llmService.getInitializedProvider(config);
    } catch (error) {
      console.error('初始化提供者失败:', error);
      throw error;
    }
  }

  async generateInnerThoughts(character: Character, debateState: DebateState) {
    const provider = await this.getProviderForCharacter(character);
    const messages = this.buildInnerThoughtsPrompt(character, debateState);
    const response = await provider.chat({
      message: messages[messages.length - 1].content,
      systemPrompt: messages[0].content,
      temperature: 0.8,
      maxTokens: 500
    });
    return response.content;
  }

  async generateSpeech(character: Character, debateState: DebateState, innerThoughts: string) {
    const provider = await this.getProviderForCharacter(character);
    const messages = this.buildSpeechPrompt(character, debateState, innerThoughts);
    const response = await provider.chat({
      message: messages[messages.length - 1].content,
      systemPrompt: messages[0].content,
      temperature: 0.6,
      maxTokens: 800
    });
    return response.content;
  }

  async generateScore(judge: Character, debateState: DebateState) {
    const provider = await this.getProviderForCharacter(judge);
    const messages = this.buildScoringPrompt(judge, debateState);
    const response = await provider.chat({
      message: messages[messages.length - 1].content,
      systemPrompt: messages[0].content,
      temperature: 0.3,
      maxTokens: 500
    });
    return response.content;
  }

  private buildInnerThoughtsPrompt(character: Character, state: DebateState): Message[] {
    return [
      {
        role: 'system',
        content: `你是一个${character.personality}的辩手,正在参与一场关于"${state.topic.title}"的辩论。
                 请基于当前辩论状态,生成你的内心想法。考虑以下因素:
                 1. 你的性格特征和价值观
                 2. 当前的辩论进展
                 3. 其他选手的发言
                 4. 可能的反驳点和论证方向`
      },
      {
        role: 'user',
        content: `当前回合：${state.currentRound}
                 历史发言：${state.speeches.map(s => `[${s.playerId}]: ${s.content}`).join('\n')}`
      }
    ];
  }

  private buildSpeechPrompt(character: Character, state: DebateState, innerThoughts: string): Message[] {
    return [
      {
        role: 'system',
        content: `基于你的内心想法,生成一段正式的辩论发言。要求:
                 1. 保持你的辩论风格和个性特征
                 2. 注意论证的逻辑性和连贯性
                 3. 适当回应对方的论点
                 4. 展现你的专业背景和知识储备
                 
                 你的内心想法是: ${innerThoughts}`
      },
      {
        role: 'user',
        content: `当前回合：${state.currentRound}
                 历史发言：${state.speeches.map(s => `[${s.playerId}]: ${s.content}`).join('\n')}`
      }
    ];
  }

  private buildScoringPrompt(judge: Character, state: DebateState): Message[] {
    return [
      {
        role: 'system',
        content: `作为裁判,请根据以下维度评分:
                 1. 论证的逻辑性 (30分)
                 2. 论据的充分性 (25分)
                 3. 表达的清晰性 (25分)
                 4. 反驳的有效性 (20分)
                 
                 请给出详细的评分理由和建议。`
      },
      {
        role: 'user',
        content: `当前回合：${state.currentRound}
                 历史发言：${state.speeches.map(s => `[${s.playerId}]: ${s.content}`).join('\n')}`
      }
    ];
  }
}