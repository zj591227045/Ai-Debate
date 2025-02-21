import type { Score, ScoreStatistics, PlayerRanking, UnifiedPlayer, BaseDebateSpeech } from '../../../types/adapters';

export class ScoringSystem {
  calculateStatistics(scores: Score[]): ScoreStatistics {
    if (!scores.length) {
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

    // 计算维度统计
    const dimensions: Record<string, number[]> = {};
    scores.forEach(score => {
      Object.entries(score.dimensions).forEach(([dim, value]) => {
        if (!dimensions[dim]) {
          dimensions[dim] = [];
        }
        dimensions[dim].push(value);
      });
    });

    const dimensionStats: ScoreStatistics['dimensions'] = {};
    Object.entries(dimensions).forEach(([dim, values]) => {
      dimensionStats[dim] = {
        average: this.calculateAverage(values),
        highest: Math.max(...values),
        lowest: Math.min(...values),
        distribution: this.calculateDistribution(values)
      };
    });

    // 计算总体统计
    const totalScores = scores.map(s => s.totalScore);
    
    return {
      dimensions: dimensionStats,
      overall: {
        average: this.calculateAverage(totalScores),
        highest: Math.max(...totalScores),
        lowest: Math.min(...totalScores),
        distribution: this.calculateDistribution(totalScores)
      }
    };
  }

  calculateRankings(scores: Score[], players: UnifiedPlayer[]): PlayerRanking[] {
    // 按玩家分组计算分数
    const playerScores: Record<string, {
      scores: number[];
      dimensions: Record<string, number[]>;
    }> = {};

    scores.forEach(score => {
      if (!playerScores[score.playerId]) {
        playerScores[score.playerId] = {
          scores: [],
          dimensions: {}
        };
      }
      
      playerScores[score.playerId].scores.push(score.totalScore);
      
      Object.entries(score.dimensions).forEach(([dim, value]) => {
        if (!playerScores[score.playerId].dimensions[dim]) {
          playerScores[score.playerId].dimensions[dim] = [];
        }
        playerScores[score.playerId].dimensions[dim].push(value);
      });
    });

    // 计算每个玩家的排名数据
    const rankings: PlayerRanking[] = players
      .filter(p => playerScores[p.id])
      .map(player => {
        const playerData = playerScores[player.id];
        const dimensionScores: Record<string, number> = {};
        
        Object.entries(playerData.dimensions).forEach(([dim, values]) => {
          dimensionScores[dim] = this.calculateAverage(values);
        });

        return {
          playerId: player.id,
          totalScore: this.calculateSum(playerData.scores),
          averageScore: this.calculateAverage(playerData.scores),
          dimensionScores,
          speechCount: playerData.scores.length,
          rank: 0 // 临时值，稍后计算
        };
      });

    // 按总分排序并分配排名
    return rankings
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((ranking, index) => ({
        ...ranking,
        rank: index + 1
      }));
  }

  private calculateAverage(values: number[]): number {
    if (!values.length) return 0;
    return this.calculateSum(values) / values.length;
  }

  private calculateSum(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0);
  }

  private calculateDistribution(values: number[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    const ranges = ['0-59', '60-69', '70-79', '80-89', '90-100'];
    
    ranges.forEach(range => {
      distribution[range] = 0;
    });

    values.forEach(value => {
      if (value < 60) distribution['0-59']++;
      else if (value < 70) distribution['60-69']++;
      else if (value < 80) distribution['70-79']++;
      else if (value < 90) distribution['80-89']++;
      else distribution['90-100']++;
    });

    return distribution;
  }

  generateMockScore(speech: BaseDebateSpeech): Score {
    console.log('使用模拟评分系统为发言生成评分:', speech.id);
    
    // 生成一个随机但合理的评分
    const generateDimensionScore = () => Math.floor(Math.random() * 15) + 75; // 75-90之间的随机分数
    
    const dimensions = {
      logic: generateDimensionScore(),
      evidence: generateDimensionScore(),
      delivery: generateDimensionScore(),
      rebuttal: generateDimensionScore()
    };

    // 计算总分（加权平均）
    const weights = {
      logic: 0.3,
      evidence: 0.3,
      delivery: 0.2,
      rebuttal: 0.2
    };

    const totalScore = Object.entries(dimensions).reduce((total, [dim, score]) => {
      return total + score * weights[dim as keyof typeof weights];
    }, 0);

    const mockScore: Score = {
      id: `score_${Date.now()}_${speech.id}`,
      speechId: speech.id,
      judgeId: 'mock_judge',
      playerId: speech.playerId,
      round: speech.round,
      timestamp: String(Date.now()),
      dimensions,
      totalScore,
      feedback: {
        strengths: ['论点清晰', '论证有力', '表达流畅'],
        weaknesses: ['可以进一步加强论证', '反驳力度可以增强'],
        suggestions: ['建议增加更多具体例证', '可以更好地回应对方论点']
      },
      comment: '评分系统自动生成的评分'
    };

    console.log('模拟评分生成完成:', {
      speechId: speech.id,
      totalScore: mockScore.totalScore,
      dimensions: mockScore.dimensions
    });

    return mockScore;
  }

  calculateTotalScore(scores: { [key: string]: number }, weights: { [key: string]: number }): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const dimension in weights) {
      if (scores[dimension] !== undefined) {
        totalScore += scores[dimension] * weights[dimension];
        totalWeight += weights[dimension];
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }
} 