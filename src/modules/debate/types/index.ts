/**
 * 辩论服务类型定义
 */

import { ModelConfig } from '../../model/types';

/**
 * 辩论主题
 */
export interface DebateTopic {
  id: string;
  title: string;
  description: string;
  background?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * 辩手角色
 */
export interface Debater {
  id: string;
  name: string;
  modelConfig: ModelConfig;
  personality?: string;
  background?: string;
  speakingStyle?: string;
  values?: string;
  argumentationStyle?: string;
}

/**
 * 发言内容
 */
export interface Speech {
  id: string;
  playerId: string;
  content: string;
  reasoningContent?: string;
  timestamp: string | number;
  round: number;
  references?: string[];
  role: 'assistant' | 'user' | 'system';
  type: 'speech' | 'innerThoughts' | 'system';
}

export interface BaseDebateSpeech {
  id: string;
  playerId: string;
  content: string;
  reasoningContent?: string;
  timestamp: string | number;
  round: number;
  references: string[];
  role: 'assistant' | 'user' | 'system';
  type: 'speech' | 'innerThoughts';
}

/**
 * 辩论上下文
 */
export interface DebateContext {
  topic: DebateTopic;
  currentRound: number;
  totalRounds: number;
  previousSpeeches: Speech[];
}

/**
 * 辩论请求参数
 */
export interface DebateRequest {
  debater: Debater;
  context: DebateContext;
  systemPrompt?: string;
  stream?: boolean;
}

/**
 * 辩论响应
 */
export interface DebateResponse {
  content: string;
  reasoningContent?: string;
  references?: string[];
  metadata?: Record<string, any>;
}

/**
 * 辩论服务接口
 */
export interface DebateService {
  generateSpeech(request: DebateRequest): Promise<DebateResponse>;
  generateSpeechStream(request: DebateRequest): AsyncGenerator<string>;
} 