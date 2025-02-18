import { EventEmitter } from 'events';
import type { 
  IScoringSystem,
  Score,
  ProcessedSpeech,
  ScoringContext,
  ScoreStatistics,
  PlayerRanking,
  SpeechRole
} from '../types/interfaces';
import { LLMService } from './LLMService';

export class ScoringSystem implements IScoringSystem {
  private scores: Score[] = [];
  private eventEmitter: EventEmitter;
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.eventEmitter = new EventEmitter();
    this.llmService = llmService;
  }

  async generateScore(speech: ProcessedSpeech, context: ScoringContext): Promise<Score> {
    try {
      // 使用 LLM 生成评分
      const scoreGen = this.llmService.generateScore(speech, context);
      let scoreContent = '';
      
      for await (const chunk of scoreGen) {
        scoreContent += chunk;
      }
      
      try {
        // 解析 LLM 返回的评分结果
        const scoreData = JSON.parse(scoreContent);
        
        // 验证评分数据
        this.validateScoreData(scoreData);
        
        const score: Score = {
          id: `score_${Date.now()}`,
          speechId: speech.id,
          judgeId: context.judge.id,
          playerId: speech.playerId,
          round: speech.round,
          timestamp: Date.now(),
          dimensions: scoreData.dimensions,
          totalScore: this.calculateTotalScore(scoreData.dimensions),
          feedback: {
            strengths: scoreData.feedback.strengths,
            weaknesses: scoreData.feedback.weaknesses,
            suggestions: scoreData.feedback.suggestions
          },
          comment: scoreData.comment
        };

        // 保存评分并触发事件
        this.scores.push(score);
        this.eventEmitter.emit('score:generated', score);
        return score;
      } catch (parseError) {
        console.warn('评分结果解析失败，使用模拟评分:', parseError);
        return this.generateFallbackScore(speech, context);
      }
    } catch (error) {
      console.warn('LLM评分生成失败，使用模拟评分:', error);
      return this.generateFallbackScore(speech, context);
    }
  }

  private validateScoreData(data: any): void {
    if (!data.dimensions || typeof data.dimensions !== 'object') {
      throw new Error('无效的维度评分数据');
    }

    const requiredDimensions = ['logic', 'evidence', 'delivery', 'rebuttal'];
    for (const dim of requiredDimensions) {
      if (typeof data.dimensions[dim] !== 'number' || 
          data.dimensions[dim] < 0 || 
          data.dimensions[dim] > 100) {
        throw new Error(`维度 ${dim} 的评分无效`);
      }
    }

    if (!Array.isArray(data.feedback?.strengths) || 
        !Array.isArray(data.feedback?.weaknesses) || 
        !Array.isArray(data.feedback?.suggestions)) {
      throw new Error('无效的反馈数据格式');
    }

    if (typeof data.comment !== 'string') {
      throw new Error('无效的评语格式');
    }
  }

  private generateFallbackScore(speech: ProcessedSpeech, context: ScoringContext): Score {
    const dimensions = {
      logic: this.generateMockDimensionScore(),
      evidence: this.generateMockDimensionScore(),
      delivery: this.generateMockDimensionScore(),
      rebuttal: this.generateMockDimensionScore()
    };

    const score: Score = {
      id: `score_${Date.now()}`,
      speechId: speech.id,
      judgeId: context.judge.id,
      playerId: speech.playerId,
      round: speech.round,
      timestamp: Date.now(),
      dimensions,
      totalScore: this.calculateTotalScore(dimensions),
      feedback: {
        strengths: ['论点清晰', '论据充分', '表达流畅'],
        weaknesses: ['可以进一步加强论证', '反驳力度可以增强'],
        suggestions: ['建议增加更多具体例证', '可以更好地回应对方论点']
      },
      comment: '整体表现不错，论证较为充分，但仍有提升空间。'
    };

    this.scores.push(score);
    this.eventEmitter.emit('score:generated', score);
    return score;
  }

  private generateMockDimensionScore(): number {
    return Math.floor(Math.random() * 15) + 75; // 75-90之间的随机分数
  }

  private calculateTotalScore(dimensions: Record<string, number>): number {
    const weights = {
      logic: 0.3,
      evidence: 0.3,
      delivery: 0.2,
      rebuttal: 0.2
    };

    return Object.entries(dimensions).reduce((total, [dim, score]) => {
      return total + score * weights[dim as keyof typeof weights];
    }, 0);
  }

  getScoreStatistics(): ScoreStatistics {
    const dimensions: Record<string, {
      total: number;
      count: number;
      highest: number;
      lowest: number;
      scores: number[];
    }> = {};

    let overallTotal = 0;
    let overallHighest = 0;
    let overallLowest = Infinity;
    const overallScores: number[] = [];

    // 统计各维度分数
    this.scores.forEach(score => {
      Object.entries(score.dimensions).forEach(([dim, value]) => {
        if (!dimensions[dim]) {
          dimensions[dim] = {
            total: 0,
            count: 0,
            highest: 0,
            lowest: Infinity,
            scores: []
          };
        }
        
        dimensions[dim].total += value;
        dimensions[dim].count++;
        dimensions[dim].highest = Math.max(dimensions[dim].highest, value);
        dimensions[dim].lowest = Math.min(dimensions[dim].lowest, value);
        dimensions[dim].scores.push(value);
      });

      overallTotal += score.totalScore;
      overallHighest = Math.max(overallHighest, score.totalScore);
      overallLowest = Math.min(overallLowest, score.totalScore);
      overallScores.push(score.totalScore);
    });

    // 计算分布
    const calculateDistribution = (scores: number[]): Record<string, number> => {
      const distribution: Record<string, number> = {};
      scores.forEach(score => {
        const range = Math.floor(score / 10) * 10;
        distribution[`${range}-${range + 9}`] = (distribution[`${range}-${range + 9}`] || 0) + 1;
      });
      return distribution;
    };

    return {
      dimensions: Object.entries(dimensions).reduce((acc, [dim, stats]) => ({
        ...acc,
        [dim]: {
          average: stats.total / stats.count,
          highest: stats.highest,
          lowest: stats.lowest,
          distribution: calculateDistribution(stats.scores)
        }
      }), {}),
      overall: {
        average: overallTotal / this.scores.length,
        highest: overallHighest,
        lowest: overallLowest,
        distribution: calculateDistribution(overallScores)
      }
    };
  }

  getPlayerRankings(): PlayerRanking[] {
    const playerStats: Record<string, {
      totalScore: number;
      scores: number[];
      dimensionScores: Record<string, number[]>;
      speechCount: number;
    }> = {};

    // 收集每个选手的统计数据
    this.scores.forEach(score => {
      if (!playerStats[score.playerId]) {
        playerStats[score.playerId] = {
          totalScore: 0,
          scores: [],
          dimensionScores: {},
          speechCount: 0
        };
      }

      const stats = playerStats[score.playerId];
      stats.totalScore += score.totalScore;
      stats.scores.push(score.totalScore);
      stats.speechCount++;

      Object.entries(score.dimensions).forEach(([dim, value]) => {
        if (!stats.dimensionScores[dim]) {
          stats.dimensionScores[dim] = [];
        }
        stats.dimensionScores[dim].push(value);
      });
    });

    // 计算排名
    const rankings = Object.entries(playerStats).map(([playerId, stats]) => ({
      playerId,
      totalScore: stats.totalScore,
      averageScore: stats.totalScore / stats.speechCount,
      dimensionScores: Object.entries(stats.dimensionScores).reduce((acc, [dim, scores]) => ({
        ...acc,
        [dim]: scores.reduce((sum, score) => sum + score, 0) / scores.length
      }), {}),
      speechCount: stats.speechCount,
      rank: 0 // 将在排序后设置
    }));

    // 按平均分排序并设置排名
    return rankings
      .sort((a, b) => b.averageScore - a.averageScore)
      .map((ranking, index) => ({
        ...ranking,
        rank: index + 1
      }));
  }
} 