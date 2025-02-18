import { EventEmitter } from 'events';
import type { 
  IScoringSystem,
  Score,
  ProcessedSpeech,
  ScoringContext,
  ScoreStatistics,
  PlayerRanking,
  SpeechRole,
  ScoringDimension
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

  // 添加事件订阅方法
  onCommentStart(handler: () => void): void {
    this.eventEmitter.on('score:comment_start', handler);
  }

  onCommentUpdate(handler: (chunk: string) => void): void {
    this.eventEmitter.on('score:comment_update', handler);
  }

  onCommentComplete(handler: (comment: string) => void): void {
    this.eventEmitter.on('score:comment_complete', handler);
  }

  onDimensionUpdate(handler: (data: { dimension: string; score: number }) => void): void {
    this.eventEmitter.on('score:dimension_update', handler);
  }

  removeAllListeners(): void {
    this.eventEmitter.removeAllListeners();
  }

  async generateScore(speech: ProcessedSpeech, context: ScoringContext): Promise<Score> {
    try {
      // 使用 LLM 生成评分
      const scoreGen = this.llmService.generateScore(speech, context);
      let scoreContent = '';
      let currentComment = '';
      let isParsingScores = false;
      const dimensions: Record<string, number> = {};
      
      // 收集所有的流式输出
      for await (const chunk of scoreGen) {
        scoreContent += chunk;
        
        // 如果遇到"总评："，开始收集评语
        if (chunk.includes('总评：')) {
          isParsingScores = false;
          // 触发评语开始事件
          this.eventEmitter.emit('score:comment_start');
          continue;
        }
        
        // 如果遇到"第三部分：维度评分"，开始解析分数
        if (chunk.includes('第三部分：维度评分')) {
          isParsingScores = true;
          // 如果之前在收集评语，触发评语完成事件
          if (currentComment) {
            this.eventEmitter.emit('score:comment_complete', currentComment.trim());
          }
          continue;
        }
        
        // 如果在解析分数模式下，检查是否是分数行
        if (isParsingScores) {
          const lines = chunk.split('\n');
          for (const line of lines) {
            const scoreMatch = line.trim().match(/^([^：]+)：\s*(\d+)\s*$/);
            if (scoreMatch) {
              const [, dimension, scoreStr] = scoreMatch;
              const score = parseInt(scoreStr, 10);
              if (!isNaN(score) && score >= 0 && score <= 100) {
                const dimensionName = dimension.trim();
                dimensions[dimensionName] = score;
                // 触发单个维度分数更新事件
                this.eventEmitter.emit('score:dimension_update', {
                  dimension: dimensionName,
                  score
                });
              }
            }
          }
        } else {
          // 如果不在解析分数模式，则收集评语
          currentComment += chunk;
          // 实时触发评语更新事件
          this.eventEmitter.emit('score:comment_update', chunk);
        }
      }

      // 在所有内容接收完成后，重新解析一次分数
      const scoreLines = scoreContent.split('\n');
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
      
      console.log('开始解析评分内容:', scoreContent);
      console.log('当前评语:', currentComment);
      console.log('当前维度分数:', dimensions);
      
      // 验证评分数据
      const finalResult = {
        dimensions,
        comment: currentComment.trim()
      };
      
      console.log('解析后的评分数据:', finalResult);

      // 验证评分数据
      this.validateScoreData(finalResult, context);
      
      const score: Score = {
        id: `score_${Date.now()}`,
        speechId: speech.id,
        judgeId: context.judge.id,
        playerId: speech.playerId,
        round: speech.round,
        timestamp: Date.now(),
        dimensions: finalResult.dimensions,
        totalScore: this.calculateTotalScore(finalResult.dimensions, context.rules.dimensions),
        comment: finalResult.comment
      };

      console.log('生成的最终评分:', score);

      // 触发最终评分完成事件
      this.eventEmitter.emit('score:complete', score);
      
      // 保存评分并返回
      this.scores.push(score);
      return score;
    } catch (error) {
      console.error('LLM评分生成失败，详细错误:', error);
      throw error; // 不再使用fallback评分，而是直接抛出错误
    }
  }

  private validateScoreData(data: any, context: ScoringContext): void {
    if (!data.dimensions || typeof data.dimensions !== 'object') {
      throw new Error('无效的维度评分数据');
    }

    if (typeof data.comment !== 'string') {
      throw new Error('无效的评语格式');
    }

    // 检查每个维度的分数是否在有效范围内
    Object.entries(data.dimensions).forEach(([dim, score]) => {
      if (typeof score !== 'number' || score < 0 || score > 100) {
        throw new Error(`维度 ${dim} 的评分无效: ${score}`);
      }
    });

    // 从context中获取维度配置
    const requiredDimensions = new Map(
      context.rules.dimensions.map(dim => [dim.name, dim.weight])
    );
    
    const actualDimensions = new Set(Object.keys(data.dimensions));
    
    console.log('期望的维度:', Array.from(requiredDimensions.keys()));
    console.log('实际的维度:', Array.from(actualDimensions));
    console.log('解析到的维度分数:', data.dimensions);

    const missingDimensions = Array.from(requiredDimensions.keys())
      .filter(dim => !actualDimensions.has(dim));
    
    if (missingDimensions.length > 0) {
      console.error('缺失的维度:', missingDimensions);
      console.error('当前维度:', Array.from(actualDimensions));
      throw new Error(`评分维度不完整，缺少: ${missingDimensions.join(', ')}`);
    }
  }

  private calculateTotalScore(dimensions: Record<string, number>, rules: ScoringDimension[]): number {
    // 从rules中获取维度权重
    const weights: Record<string, number> = {};
    rules.forEach(rule => {
      weights[rule.name] = rule.weight;
    });

    // 计算加权总分
    let totalScore = 0;
    Object.entries(dimensions).forEach(([dimension, score]) => {
      const weight = weights[dimension] || 0;
      // 将原始分数(0-100)转换为权重分数
      totalScore += (score / 100) * weight;
    });

    return totalScore;
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