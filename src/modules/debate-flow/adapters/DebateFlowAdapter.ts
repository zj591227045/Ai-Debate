import { EventEmitter } from 'events';
import type { Player } from '@game-config/types';
import type {
  IDebateFlow,
  DebateFlowConfig,
  DebateFlowState,
  SpeechInput,
  StateChangeHandler
} from '../types/interfaces';
import { DebateFlowEvent } from '../types/events';

export class DebateFlowAdapter {
  private readonly debateFlow: IDebateFlow;
  private readonly eventEmitter: EventEmitter;
  private lastState: DebateFlowState | null = null;

  constructor(debateFlow: IDebateFlow) {
    this.debateFlow = debateFlow;
    this.eventEmitter = new EventEmitter();

    // 订阅状态变更
    this.debateFlow.subscribeToStateChange((state) => {
      this.handleStateChange(state);
    });
  }

  // 初始化辩论
  async initialize(config: DebateFlowConfig): Promise<void> {
    await this.debateFlow.initialize(config);
    this.eventEmitter.emit(DebateFlowEvent.DEBATE_STARTED, this.getCurrentState());
  }

  // 开始辩论
  async startDebate(): Promise<void> {
    await this.debateFlow.startDebate();
  }

  // 暂停辩论
  async pauseDebate(): Promise<void> {
    await this.debateFlow.pauseDebate();
  }

  // 继续辩论
  async resumeDebate(): Promise<void> {
    await this.debateFlow.resumeDebate();
  }

  // 结束辩论
  async endDebate(): Promise<void> {
    await this.debateFlow.endDebate();
  }

  // 提交发言
  async submitSpeech(speech: SpeechInput): Promise<void> {
    await this.debateFlow.submitSpeech(speech);
  }

  // 跳过当前发言者
  async skipCurrentSpeaker(): Promise<void> {
    await this.debateFlow.skipCurrentSpeaker();
  }

  async startNextRound(): Promise<void> {
    await this.debateFlow.startNextRound();
  }

  // 获取当前状态
  getCurrentState(): DebateFlowState {
    return this.debateFlow.getCurrentState();
  }

  // 获取当前发言者
  getCurrentSpeaker(): Player | null {
    const state = this.getCurrentState();
    return state.currentSpeaker;
  }

  // 订阅状态变更
  onStateChange(handler: StateChangeHandler): () => void {
    this.eventEmitter.on('state:changed', handler);
    return () => this.eventEmitter.off('state:changed', handler);
  }

  // 订阅特定事件
  on(event: DebateFlowEvent, handler: (data: any) => void): () => void {
    this.eventEmitter.on(event, handler);
    return () => this.eventEmitter.off(event, handler);
  }

  private handleStateChange(newState: DebateFlowState): void {
    const prevState = this.lastState;
    this.lastState = newState;

    // 发出状态变更事件
    this.eventEmitter.emit('state:changed', newState);

    // 处理状态转换事件
    if (prevState?.status !== newState.status) {
      switch (newState.status) {
        case 'ongoing':
          this.eventEmitter.emit(DebateFlowEvent.DEBATE_RESUMED);
          break;
        case 'paused':
          this.eventEmitter.emit(DebateFlowEvent.DEBATE_PAUSED);
          break;
        case 'completed':
          this.eventEmitter.emit(DebateFlowEvent.DEBATE_ENDED);
          break;
      }
    }

    // 处理轮次变更事件
    if (prevState?.currentRound !== newState.currentRound) {
      if (prevState) {
        this.eventEmitter.emit(DebateFlowEvent.ROUND_ENDED, {
          round: prevState.currentRound
        });
      }
      this.eventEmitter.emit(DebateFlowEvent.ROUND_STARTED, {
        round: newState.currentRound
      });
    }

    // 处理发言者变更事件
    if (prevState?.currentSpeaker?.id !== newState.currentSpeaker?.id) {
      if (newState.currentSpeaker) {
        this.eventEmitter.emit(DebateFlowEvent.SPEECH_STARTED, {
          speaker: newState.currentSpeaker
        });
      }
    }
  }
} 