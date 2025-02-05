import type { UnifiedPlayer, Speech } from '../../types/adapters';
import { createLLMService } from './llmService';
import type { AIServiceConfig } from './types';

interface GenerateThoughtsParams {
  player: UnifiedPlayer;
  context: {
    topic: {
      title: string;
      background: string;
    };
    currentRound: number;
    totalRounds: number;
    previousSpeeches: Speech[];
  };
}

interface GenerateSpeechParams {
  player: UnifiedPlayer;
  thoughts: string;
  context: {
    topic: {
      title: string;
      background: string;
    };
    currentRound: number;
    totalRounds: number;
    previousSpeeches: Speech[];
  };
}

interface GenerateScoreParams {
  judge: UnifiedPlayer;
  speech: Speech;
  scoringRules: {
    dimensions: Array<{
      id: string;
      name: string;
      weight: number;
      description: string;
      criteria: string[];
    }>;
    minScore: number;
    maxScore: number;
  };
}

// 默认配置
const DEFAULT_CONFIG: Partial<AIServiceConfig> = {
  timeout: 30000,
  maxRetries: 3
};

class DebateAIService {
  private config: AIServiceConfig;
  private llmService: ReturnType<typeof createLLMService>;
  
  constructor(config: AIServiceConfig) {
    // 先应用默认配置，然后用用户配置覆盖
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    this.llmService = createLLMService(this.config);
  }

  // 生成内心OS
  async generateThoughts(params: GenerateThoughtsParams): Promise<string> {
    try {
      const prompt = this.buildThoughtsPrompt(params);
      const response = await this.llmService.generate({
        prompt,
        temperature: 0.8, // 较高的创造性
        maxTokens: 500,
        stopSequences: ['[END]']
      });
      return this.parseThoughtsResponse(response.text);
    } catch (error) {
      this.handleError('生成内心OS失败', error);
      throw error;
    }
  }

  // 生成发言
  async generateSpeech(params: GenerateSpeechParams): Promise<string> {
    try {
      const prompt = this.buildSpeechPrompt(params);
      const response = await this.llmService.generate({
        prompt,
        temperature: 0.6, // 平衡创造性和逻辑性
        maxTokens: 800,
        stopSequences: ['[END]']
      });
      return this.parseSpeechResponse(response.text);
    } catch (error) {
      this.handleError('生成发言失败', error);
      throw error;
    }
  }

  // 生成评分
  async generateScore(params: GenerateScoreParams): Promise<{
    dimensions: Record<string, number>;
    totalScore: number;
    comment: string;
  }> {
    try {
      const prompt = this.buildScoringPrompt(params);
      const response = await this.llmService.generate({
        prompt,
        temperature: 0.3, // 更注重逻辑性
        maxTokens: 500,
        stopSequences: ['}']
      });
      return this.parseScoringResponse(response.text);
    } catch (error) {
      this.handleError('生成评分失败', error);
      throw error;
    }
  }

  // 错误处理
  private handleError(context: string, error: unknown): never {
    if (error instanceof Error) {
      // 包装错误，保留原始错误栈
      const wrappedError = new Error(`${context}: ${error.message}`);
      wrappedError.stack = error.stack;
      throw wrappedError;
    }
    throw new Error(`${context}: 未知错误`);
  }

  // 取消当前请求
  cancel() {
    this.llmService.cancel();
  }

  // 构建提示词
  private buildThoughtsPrompt({ player, context }: GenerateThoughtsParams): string {
    return `你是一位专业的辩论选手，现在需要你以思考者的身份，分析当前辩论局势并思考策略。

角色信息：
- 姓名：${player.name}
- 性格：${player.personality || '未指定'}
- 说话风格：${player.speakingStyle || '未指定'}
- 专业背景：${player.background || '未指定'}
- 价值观：${player.values || '未指定'}
- 论证风格：${player.argumentationStyle || '未指定'}

辩论信息：
- 主题：${context.topic.title}
- 背景：${context.topic.background}
- 当前轮次：${context.currentRound}/${context.totalRounds}

历史发言：
${context.previousSpeeches.map(speech => 
  `[${speech.playerId}]: ${speech.content}`
).join('\n')}

请以内心独白的方式，分析当前局势并思考下一步策略。要求：
1. 保持角色特征的一致性
2. 分析其他选手的论点优劣
3. 思考可能的反驳方向
4. 规划下一步的论证策略`;
  }

  private buildSpeechPrompt({ player, thoughts, context }: GenerateSpeechParams): string {
    return `你是一位专业的辩论选手，现在需要你基于之前的思考，生成正式的辩论发言。

角色信息：[同上]

辩论信息：[同上]

你的内心思考：${thoughts}

请基于以上信息，生成正式的辩论发言。要求：
1. 保持角色特征的一致性
2. 回应其他选手的论点
3. 提出新的论证
4. 注意语言的严谨性`;
  }

  private buildScoringPrompt({ judge, speech, scoringRules }: GenerateScoreParams): string {
    return `你是一位专业的辩论赛评委，需要以特定的评委身份对辩手的发言进行评分和点评。

评委信息：
- 姓名：${judge.name}
- 专业背景：${judge.background || '未指定'}

评分维度：
${scoringRules.dimensions.map(dim => 
  `- ${dim.name}（权重：${dim.weight}）：${dim.description}
   评分标准：${dim.criteria.join('、')}`
).join('\n')}

待评分发言：
${speech.content}

请以评委身份，按照以下JSON格式输出评分结果：
{
  "dimensions": {
    [维度ID]: number // 分数
  },
  "totalScore": number, // 总分
  "comment": string    // 评语
}`;
  }

  private parseThoughtsResponse(response: string): string {
    // 清理和验证响应
    const cleaned = response.trim();
    if (!cleaned) {
      throw new Error('AI返回了空的内心OS');
    }
    return cleaned;
  }

  private parseSpeechResponse(response: string): string {
    // 清理和验证响应
    const cleaned = response.trim();
    if (!cleaned) {
      throw new Error('AI返回了空的发言');
    }
    return cleaned;
  }

  private parseScoringResponse(response: string): {
    dimensions: Record<string, number>;
    totalScore: number;
    comment: string;
  } {
    try {
      // 尝试修复不完整的JSON
      let jsonStr = response.trim();
      if (!jsonStr.endsWith('}')) {
        jsonStr += '}';
      }
      
      const result = JSON.parse(jsonStr);
      
      // 验证必要字段
      if (!result.dimensions || typeof result.totalScore !== 'number' || !result.comment) {
        throw new Error('评分结果格式不正确');
      }
      
      // 验证分数范围
      const scores = Object.values(result.dimensions);
      if (scores.some(score => typeof score !== 'number' || score < 0 || score > 100)) {
        throw new Error('评分范围不正确');
      }
      
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`评分结果解析失败: ${error.message}`);
      }
      throw new Error('评分结果解析失败');
    }
  }
}

export const createDebateAIService = (config: AIServiceConfig) => {
  return new DebateAIService(config);
}; 