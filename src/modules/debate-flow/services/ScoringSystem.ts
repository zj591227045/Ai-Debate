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
  private readonly eventEmitter: EventEmitter;
  private readonly llmService: LLMService;
  private scores: Score[] = [];

  constructor(llmService: LLMService) {
    this.eventEmitter = new EventEmitter();
    this.llmService = llmService;
  }

  async generateScore(speech: ProcessedSpeech, context: ScoringContext): Promise<Score> {
    try {
      // 尝试使用LLM生成评分
      const scoreGen = this.llmService.generateScore(speech, context);
      let scoreContent = '';
      
      for await (const chunk of scoreGen) {
        scoreContent += chunk;
      }
      
      try {
        // 尝试解析LLM返回的评分结果
        const scoreData = JSON.parse(scoreContent);
        
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

        this.scores.push(score);
        this.eventEmitter.emit('score:generated', score);
        return score;
      } catch (parseError) {
        console.warn('评分结果解析失败，使用模拟评分:', parseError);
        throw parseError; // 抛出以触发模拟评分生成
      }
    } catch (error) {
      console.warn('LLM评分生成失败，使用模拟评分:', error);
      
      // 生成模拟评分
      const mockScore: Score = {
        id: `score_${Date.now()}`,
        speechId: speech.id,
        judgeId: context.judge.id,
        playerId: speech.playerId,
        round: speech.round,
        timestamp: Date.now(),
        dimensions: {
          logic: this.generateMockDimensionScore(),
          evidence: this.generateMockDimensionScore(),
          delivery: this.generateMockDimensionScore(),
          rebuttal: this.generateMockDimensionScore()
        },
        totalScore: 0, // 将在下面计算
        feedback: {
          strengths: ['论点清晰', '论据充分', '表达流畅'],
          weaknesses: ['可以进一步加强论证', '反驳力度可以增强'],
          suggestions: ['建议增加更多具体例证', '可以更好地回应对方论点']
        },
        comment: '整体表现不错，论证较为充分，但仍有提升空间。建议在下一轮发言中加强反驳力度，并提供更多具体的例证支持。'
      };
      
      // 计算总分
      mockScore.totalScore = this.calculateTotalScore(mockScore.dimensions);
      
      this.scores.push(mockScore);
      this.eventEmitter.emit('score:generated', mockScore);
      return mockScore;
    }
  }

  private generateMockDimensionScore(): number {
    // 生成70-95之间的随机分数
    return Math.floor(Math.random() * 25) + 70;
  }

  private calculateTotalScore(dimensions: Record<string, number>): number {
    const weights = {
      logic: 0.3,
      evidence: 0.3,
      delivery: 0.2,
      rebuttal: 0.2
    };

    return Object.entries(dimensions).reduce((total, [dimension, score]) => {
      return total + score * (weights[dimension as keyof typeof weights] || 0);
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