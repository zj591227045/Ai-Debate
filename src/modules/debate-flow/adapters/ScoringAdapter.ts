import { EventEmitter } from 'events';
import type { 
  Score, 
  ProcessedSpeech, 
  ScoringContext,
  IScoringSystem,
  PlayerRanking 
} from '../types/interfaces';

export class ScoringAdapter {
  private readonly scoringSystem: IScoringSystem;
  private readonly eventEmitter: EventEmitter;
  private scores: Score[] = [];

  constructor(scoringSystem: IScoringSystem) {
    this.scoringSystem = scoringSystem;
    this.eventEmitter = new EventEmitter();
  }

  // 生成评分
  async generateScore(speech: ProcessedSpeech, context: ScoringContext): Promise<Score> {
    const score = await this.scoringSystem.generateScore(speech, context);
    this.scores.push(score);
    this.eventEmitter.emit('score:generated', score);
    return score;
  }

  // 获取评分历史
  getScores(): Score[] {
    return [...this.scores];
  }

  // 获取选手排名
  getPlayerRankings(): PlayerRanking[] {
    return this.scoringSystem.getPlayerRankings();
  }

  // 订阅评分事件
  onScoreGenerated(handler: (score: Score) => void): () => void {
    this.eventEmitter.on('score:generated', handler);
    return () => this.eventEmitter.off('score:generated', handler);
  }

  // 清除评分历史
  clearScores(): void {
    this.scores = [];
    this.eventEmitter.emit('scores:cleared');
  }
} 