import type { Player, DebateConfig } from '@game-config/types';
import type { Speech } from '@debate/types';
import type { DebateFlowState } from './state';
import type { EventHandler } from './events';

export interface DebateFlowController {
  // 初始化辩论流程
  initialize(config: DebateConfig): Promise<void>;
  
  // 开始辩论
  startDebate(): Promise<void>;
  
  // 暂停辩论
  pauseDebate(): Promise<void>;
  
  // 继续辩论
  resumeDebate(): Promise<void>;
  
  // 结束辩论
  endDebate(): Promise<void>;
  
  // 跳过当前发言者
  skipCurrentSpeaker(): Promise<void>;
  
  // 强制结束当前发言
  forceEndCurrentSpeech(): Promise<void>;
  
  // 保存当前状态并退出到配置界面
  saveAndExit(): Promise<void>;
  
  // 提交人类选手发言
  submitHumanSpeech(playerId: string, content: string): Promise<void>;
  
  // 获取当前状态
  getCurrentState(): DebateFlowState;
  
  // 获取当前发言者
  getCurrentSpeaker(): Player | null;
  
  // 获取发言历史
  getSpeechHistory(): Speech[];
  
  // 订阅状态变更
  subscribeToStateChange(handler: (state: DebateFlowState) => void): () => void;
} 