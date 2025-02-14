import type { DebateFlowState, Speech } from '../types/interfaces';
import type { Score } from './ScoringSystem';

export interface StateSnapshot {
  id: string;
  timestamp: number;
  state: DebateFlowState;
  metadata: {
    version: string;
    description?: string;
  };
}

export class StateManager {
  private currentState: DebateFlowState;
  private stateHistory: StateSnapshot[] = [];
  private readonly maxHistorySize: number = 50;

  constructor(initialState: DebateFlowState) {
    this.currentState = this.deepClone(initialState);
    this.createSnapshot('初始状态');
  }

  // 获取当前状态
  getCurrentState(): DebateFlowState {
    return this.deepClone(this.currentState);
  }

  // 更新状态
  updateState(
    updater: (state: DebateFlowState) => DebateFlowState,
    description?: string
  ): void {
    const newState = updater(this.deepClone(this.currentState));
    this.currentState = newState;
    this.createSnapshot(description);
  }

  // 创建状态快照
  private createSnapshot(description?: string): void {
    const snapshot: StateSnapshot = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      state: this.deepClone(this.currentState),
      metadata: {
        version: '1.0',
        description
      }
    };

    this.stateHistory.push(snapshot);

    // 限制历史记录大小
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  // 回滚到指定快照
  rollbackToSnapshot(snapshotId: string): boolean {
    const snapshot = this.stateHistory.find(s => s.id === snapshotId);
    if (!snapshot) {
      return false;
    }

    this.currentState = this.deepClone(snapshot.state);
    return true;
  }

  // 回滚到上一个状态
  rollbackToPrevious(): boolean {
    if (this.stateHistory.length < 2) {
      return false;
    }

    // 移除当前状态
    this.stateHistory.pop();
    // 获取上一个状态
    const previousSnapshot = this.stateHistory[this.stateHistory.length - 1];
    this.currentState = this.deepClone(previousSnapshot.state);
    return true;
  }

  // 获取状态历史
  getStateHistory(): StateSnapshot[] {
    return this.stateHistory.map(snapshot => ({
      ...snapshot,
      state: this.deepClone(snapshot.state)
    }));
  }

  // 导出状态
  exportState(): string {
    return JSON.stringify({
      currentState: this.currentState,
      stateHistory: this.stateHistory
    });
  }

  // 导入状态
  importState(stateData: string): boolean {
    try {
      const { currentState, stateHistory } = JSON.parse(stateData);
      this.currentState = this.deepClone(currentState);
      this.stateHistory = this.deepClone(stateHistory);
      return true;
    } catch (error) {
      console.error('导入状态失败:', error);
      return false;
    }
  }

  // 添加发言记录
  addSpeech(speech: Speech): void {
    this.updateState(state => ({
      ...state,
      speeches: [...state.speeches, {
        ...speech,
        timestamp: typeof speech.timestamp === 'string' ? Date.now() : speech.timestamp
      }]
    }), `添加发言: ${speech.playerId}`);
  }

  // 添加评分记录
  addScore(score: Score): void {
    this.updateState(state => ({
      ...state,
      scores: [...(state.scores || []), score]
    }), `添加评分: ${score.speechId}`);
  }

  // 深拷贝辅助函数
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
} 