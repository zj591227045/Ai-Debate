import { Service } from 'typedi';
import { UnifiedLLMService } from '../../llm/services/UnifiedLLMService';
import { ModelService } from './ModelService';
import { LLMError, LLMErrorCode } from '../../llm/types/error';
import type { ChatRequest, ChatResponse } from '../../llm/api/types';

export interface TestMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface TestSession {
  modelId: string;
  messages: TestMessage[];
  startTime: number;
  lastMessageTime?: number;
}

@Service()
export class ModelTestService {
  private llmService: UnifiedLLMService;
  private modelService: ModelService;
  private sessions: Map<string, TestSession>;

  constructor() {
    this.llmService = UnifiedLLMService.getInstance();
    this.modelService = new ModelService();
    this.sessions = new Map();
  }

  /**
   * 创建新的测试会话
   */
  async createSession(modelId: string): Promise<string> {
    const config = await this.modelService.getModelById(modelId);
    if (!config) {
      throw new LLMError(LLMErrorCode.MODEL_NOT_FOUND, `模型 ${modelId} 不存在`);
    }

    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, {
      modelId,
      messages: [],
      startTime: Date.now()
    });

    return sessionId;
  }

  /**
   * 发送测试消息
   */
  async sendMessage(
    sessionId: string,
    message: string,
    systemPrompt?: string
  ): Promise<ChatResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new LLMError(LLMErrorCode.SESSION_NOT_FOUND, `会话 ${sessionId} 不存在`);
    }

    const config = await this.modelService.getModelById(session.modelId);
    if (!config) {
      throw new LLMError(LLMErrorCode.MODEL_NOT_FOUND, `模型 ${session.modelId} 不存在`);
    }

    // 设置模型
    await this.llmService.setModel(session.modelId);

    // 添加用户消息
    const userMessage: TestMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    session.messages.push(userMessage);

    // 发送请求
    const response = await this.llmService.chat({
      message,
      systemPrompt,
      temperature: config.parameters?.temperature,
      maxTokens: config.parameters?.maxTokens,
      topP: config.parameters?.topP
    });

    // 添加助手消息
    const assistantMessage: TestMessage = {
      role: 'assistant',
      content: response.content ?? '',
      timestamp: Date.now()
    };
    session.messages.push(assistantMessage);
    session.lastMessageTime = Date.now();

    return response;
  }

  /**
   * 开始流式测试对话
   */
  async *streamMessage(
    sessionId: string,
    message: string,
    systemPrompt?: string
  ): AsyncGenerator<ChatResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new LLMError(LLMErrorCode.SESSION_NOT_FOUND, `会话 ${sessionId} 不存在`);
    }

    const config = await this.modelService.getModelById(session.modelId);
    if (!config) {
      throw new LLMError(LLMErrorCode.MODEL_NOT_FOUND, `模型 ${session.modelId} 不存在`);
    }

    // 设置模型
    await this.llmService.setModel(session.modelId);

    // 添加用户消息
    const userMessage: TestMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    session.messages.push(userMessage);

    let assistantContent = '';

    // 开始流式对话
    try {
      for await (const response of this.llmService.stream({
        message,
        systemPrompt,
        temperature: config.parameters?.temperature,
        maxTokens: config.parameters?.maxTokens,
        topP: config.parameters?.topP,
        stream: true
      })) {
        assistantContent += response.content ?? '';
        yield response;
      }
    } finally {
      // 添加助手消息
      const assistantMessage: TestMessage = {
        role: 'assistant',
        content: assistantContent,
        timestamp: Date.now()
      };
      session.messages.push(assistantMessage);
      session.lastMessageTime = Date.now();
    }
  }

  /**
   * 获取会话历史消息
   */
  getSessionMessages(sessionId: string): TestMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new LLMError(LLMErrorCode.SESSION_NOT_FOUND, `会话 ${sessionId} 不存在`);
    }
    return [...session.messages];
  }

  /**
   * 清除会话历史
   */
  clearSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages = [];
    }
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * 清理过期会话（超过2小时未活动）
   */
  cleanupSessions(): void {
    const now = Date.now();
    const expirationTime = 2 * 60 * 60 * 1000; // 2小时

    for (const [sessionId, session] of this.sessions.entries()) {
      const lastActivity = session.lastMessageTime || session.startTime;
      if (now - lastActivity > expirationTime) {
        this.sessions.delete(sessionId);
      }
    }
  }
}