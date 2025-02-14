import type { Speech } from '../types/speech';
import type { Score, Judge, GameConfig } from '../types/score';
import type { GenerateStreamOptions } from '../../llm/types/api';

export interface ILLMService {
  generateStream(options: GenerateStreamOptions): AsyncIterable<string>;
}

export interface ScoringRules {
  dimensions: Array<{
    name: string;
    weight: number;
    description: string;
    criteria: string[];
  }>;
}

export interface ScoreStatistics {
  dimensions: {
    [dimensionName: string]: {
      average: number;
      highest: number;
      lowest: number;
      distribution: {
        [range: string]: number; // 例如: "0-20": 5 表示0-20分区间有5个评分
      };
    };
  };
  overall: {
    average: number;
    highest: number;
    lowest: number;
    distribution: {
      [range: string]: number;
    };
  };
}

export interface PlayerRanking {
  playerId: string;
  totalScore: number;
  averageScore: number;
  dimensionScores: {
    [dimensionName: string]: number;
  };
  speechCount: number;
  rank: number;
}

export { Score };

export class ScoringSystem {
  private llmService: ILLMService;
  private rules: ScoringRules;
  private scores: Score[] = [];

  constructor(
    llmServiceOrRules: ILLMService | ScoringRules,
    rules?: ScoringRules
  ) {
    if ('generateStream' in llmServiceOrRules) {
      this.llmService = llmServiceOrRules;
      this.rules = rules || {
        dimensions: [
          {
            name: '逻辑性',
            weight: 40,
            description: '论证的逻辑严密程度',
            criteria: []
          },
          {
            name: '表达',
            weight: 30,
            description: '语言表达的清晰程度',
            criteria: []
          },
          {
            name: '创新性',
            weight: 30,
            description: '论点的创新程度',
            criteria: []
          }
        ]
      };
    } else {
      // 如果只传入了规则，使用默认的 LLM 服务
      this.rules = llmServiceOrRules;
      // TODO: 这里需要获取默认的 LLM 服务实例
      throw new Error('必须提供 LLMService 实例');
    }
  }

  // 生成评分
  async generateScore(speech: Speech, player: any): Promise<Score> {
    // 为了保持兼容性，我们将现有的 scoreSpeech 方法包装为 generateScore
    return this.scoreSpeech(speech, {
      id: 'default-judge',
      name: 'AI评委',
    } as Judge, {
      topic: {
        title: '辩题',
        description: '辩题描述'
      },
      debate: {
        judging: {
          description: '评分说明',
          dimensions: [
            {
              name: '逻辑性',
              weight: 40,
              description: '论证的逻辑严密程度',
              criteria: []
            },
            {
              name: '表达',
              weight: 30,
              description: '语言表达的清晰程度',
              criteria: []
            },
            {
              name: '创新性',
              weight: 30,
              description: '论点的创新程度',
              criteria: []
            }
          ]
        }
      }
    } as GameConfig, []);
  }

  // 添加评分记录
  addScore(score: Score): void {
    this.scores.push(score);
  }

  // 获取评分统计
  getScoreStatistics(): ScoreStatistics {
    if (this.scores.length === 0) {
      return {
        dimensions: {},
        overall: {
          average: 0,
          highest: 0,
          lowest: 0,
          distribution: {}
        }
      };
    }

    // 初始化维度统计
    const dimensionStats: { [key: string]: number[] } = {};
    const allScores: number[] = [];

    // 收集所有分数
    this.scores.forEach(score => {
      Object.entries(score.dimensions).forEach(([dimension, value]) => {
        if (!dimensionStats[dimension]) {
          dimensionStats[dimension] = [];
        }
        dimensionStats[dimension].push(value);
      });
      allScores.push(score.totalScore);
    });

    // 计算分布区间
    const calculateDistribution = (scores: number[], maxScore: number) => {
      const distribution: { [key: string]: number } = {};
      const step = maxScore / 5; // 将分数分为5个区间

      for (let i = 0; i < 5; i++) {
        const rangeStart = i * step;
        const rangeEnd = (i + 1) * step;
        const range = `${Math.floor(rangeStart)}-${Math.floor(rangeEnd)}`;
        distribution[range] = scores.filter(score => 
          score >= rangeStart && score < rangeEnd
        ).length;
      }
      return distribution;
    };

    // 计算维度统计
    const dimensions = Object.entries(dimensionStats).reduce((acc, [dimension, scores]) => {
      const dimensionWeight = this.rules.dimensions.find(d => d.name === dimension)?.weight || 100;
      acc[dimension] = {
        average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        highest: Math.max(...scores),
        lowest: Math.min(...scores),
        distribution: calculateDistribution(scores, dimensionWeight)
      };
      return acc;
    }, {} as ScoreStatistics['dimensions']);

    // 计算总体统计
    const maxTotalScore = this.rules.dimensions.reduce((sum, d) => sum + d.weight, 0);
    return {
      dimensions,
      overall: {
        average: allScores.reduce((sum, score) => sum + score, 0) / allScores.length,
        highest: Math.max(...allScores),
        lowest: Math.min(...allScores),
        distribution: calculateDistribution(allScores, maxTotalScore)
      }
    };
  }

  // 获取选手排名
  getPlayerRankings(): PlayerRanking[] {
    // 按玩家分组统计分数
    const playerStats = this.scores.reduce((acc, score) => {
      if (!acc[score.playerId]) {
        acc[score.playerId] = {
          totalScore: 0,
          scores: [],
          dimensionScores: {},
          speechCount: 0
        };
      }

      acc[score.playerId].scores.push(score.totalScore);
      acc[score.playerId].totalScore += score.totalScore;
      acc[score.playerId].speechCount += 1;

      // 累加各维度分数
      Object.entries(score.dimensions).forEach(([dimension, value]) => {
        if (!acc[score.playerId].dimensionScores[dimension]) {
          acc[score.playerId].dimensionScores[dimension] = 0;
        }
        acc[score.playerId].dimensionScores[dimension] += value;
      });

      return acc;
    }, {} as Record<string, {
      totalScore: number;
      scores: number[];
      dimensionScores: Record<string, number>;
      speechCount: number;
    }>);

    // 转换为排名列表
    const rankings = Object.entries(playerStats).map(([playerId, stats]) => ({
      playerId,
      totalScore: stats.totalScore,
      averageScore: stats.totalScore / stats.speechCount,
      dimensionScores: Object.entries(stats.dimensionScores).reduce((acc, [dimension, total]) => {
        acc[dimension] = total / stats.speechCount;
        return acc;
      }, {} as Record<string, number>),
      speechCount: stats.speechCount,
      rank: 0 // 临时占位，稍后计算
    }));

    // 按平均分排序并分配排名
    return rankings
      .sort((a, b) => b.averageScore - a.averageScore)
      .map((ranking, index) => ({
        ...ranking,
        rank: index + 1
      }));
  }

  // 生成评分提示词
  private generateScoringPrompt(
    speech: Speech,
    judge: Judge,
    gameConfig: GameConfig,
    previousSpeeches: Speech[]
  ): string {
    const dimensions = gameConfig.debate.judging.dimensions;
    const dimensionsText = dimensions
      .map((d: { name: string; weight: number; description: string }) => 
        `${d.name}（${d.weight}分）：${d.description}`
      )
      .join('\n');

    const previousSpeechesText = previousSpeeches
      .map(s => `第${s.round}轮：${s.content}`)
      .join('\n');

    return `你是一位专业的辩论赛评委，需要以特定的评委身份对辩手的发言进行评分和点评。

你的身份信息：
姓名：${judge.name}
简介：${judge.introduction || ''}
性格特征：${judge.personality || ''}
说话风格：${judge.speakingStyle || ''}
专业背景：${judge.background || ''}
价值观：${judge.values?.join('、') || ''}
论证风格：${judge.argumentationStyle || ''}

评分维度包括：
${dimensionsText}

评分规则说明：
${gameConfig.debate.judging.description || ''}

请对以下发言进行评分：

辩论主题：${gameConfig.topic.title}
当前轮次：第${speech.round}轮
发言选手：${speech.player?.name || '未知选手'}
${speech.team ? `所属方：${speech.team === 'affirmative' ? '正方' : '反方'}` : ''}

该选手历史发言：
${previousSpeechesText}

本轮发言内容：
${speech.content}

请以你的评委身份，按照以下JSON格式输出评分结果：
{
  "dimensions": {
    ${dimensions.map(d => `"${d.name}": <0-${d.weight}的整数>`).join(',\n    ')}
  },
  "feedback": {
    "strengths": string[],    // 3-5个优点
    "weaknesses": string[],   // 2-3个不足
    "suggestions": string[]   // 1-2个建议
  },
  "comment": string          // 总体评语，不超过300字
}`;
  }

  // 验证评分结果
  private validateScore(score: any, dimensions: GameConfig['debate']['judging']['dimensions']): boolean {
    if (!score || typeof score !== 'object') return false;
    if (!score.dimensions || typeof score.dimensions !== 'object') return false;
    
    // 验证维度分数
    for (const dimension of dimensions) {
      const score_value = score.dimensions[dimension.name];
      if (
        typeof score_value !== 'number' || 
        score_value < 0 || 
        score_value > dimension.weight
      ) {
        return false;
      }
    }

    // 验证反馈
    if (!score.feedback || typeof score.feedback !== 'object') return false;
    if (!Array.isArray(score.feedback.strengths) || score.feedback.strengths.length < 3 || score.feedback.strengths.length > 5) return false;
    if (!Array.isArray(score.feedback.weaknesses) || score.feedback.weaknesses.length < 2 || score.feedback.weaknesses.length > 3) return false;
    if (!Array.isArray(score.feedback.suggestions) || score.feedback.suggestions.length < 1 || score.feedback.suggestions.length > 2) return false;

    // 验证评语
    if (typeof score.comment !== 'string' || score.comment.length > 300) return false;

    return true;
  }

  // 评分主方法
  async scoreSpeech(
    speech: Speech,
    judge: Judge,
    gameConfig: GameConfig,
    previousSpeeches: Speech[]
  ): Promise<Score> {
    // 生成评分提示词
    const prompt = this.generateScoringPrompt(speech, judge, gameConfig, previousSpeeches);

    // 调用LLM服务获取评分结果
    const response = await this.llmService.generateStream({
      systemPrompt: prompt,
      temperature: 0.3, // 使用较低的温度以保证评分的一致性
      maxTokens: 1000
    });

    // 收集完整的响应
    let fullResponse = '';
    for await (const chunk of response) {
      fullResponse += chunk;
    }

    // 解析JSON响应
    let scoreResult;
    try {
      scoreResult = JSON.parse(fullResponse);
    } catch (error) {
      throw new Error('评分结果格式错误');
    }

    // 验证评分结果
    if (!this.validateScore(scoreResult, gameConfig.debate.judging.dimensions)) {
      throw new Error('评分结果验证失败');
    }

    // 计算总分
    const totalScore = Object.values(scoreResult.dimensions).reduce<number>(
      (sum, score) => sum + (typeof score === 'number' ? score : 0), 
      0
    );

    // 构造评分记录
    const score: Score = {
      id: crypto.randomUUID(),
      judgeId: judge.id,
      playerId: speech.player?.id || speech.playerId,
      speechId: speech.id,
      round: speech.round,
      timestamp: Date.now(),
      dimensions: scoreResult.dimensions,
      totalScore,
      comment: scoreResult.comment,
      feedback: scoreResult.feedback
    };

    return score;
  }
} 