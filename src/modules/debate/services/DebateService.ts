/**
 * 辩论服务实现
 */

import { UnifiedLLMService } from '../../llm/services/UnifiedLLMService';
import type { ChatRequest } from '../../llm/api/types';
import type { DebateService as IDebateService, DebateRequest, DebateResponse } from '../types';
import { adaptModelConfig } from '../../llm/utils/adapters';

export class DebateService implements IDebateService {
  private static instance: DebateService;
  private llmService: UnifiedLLMService;

  private constructor() {
    this.llmService = UnifiedLLMService.getInstance();
  }

  public static getInstance(): DebateService {
    if (!DebateService.instance) {
      DebateService.instance = new DebateService();
    }
    return DebateService.instance;
  }

  /**
   * 生成系统提示词
   */
  private generateSystemPrompt(request: DebateRequest): string {
    const { debater, context, systemPrompt } = request;
    const parts: string[] = [];

    // 添加基础系统提示词
    if (systemPrompt) {
      parts.push(systemPrompt);
    }

    // 添加角色设定
    parts.push(`你现在扮演一个辩论选手，需要基于以下角色信息进行辩论：

角色信息：
姓名：${debater.name}
${debater.background ? `背景：${debater.background}` : ''}
${debater.personality ? `性格：${debater.personality}` : ''}
${debater.speakingStyle ? `说话风格：${debater.speakingStyle}` : ''}
${debater.values ? `价值观：${debater.values}` : ''}
${debater.argumentationStyle ? `论证风格：${debater.argumentationStyle}` : ''}`);

    // 添加辩论主题信息
    parts.push(`辩论主题：${context.topic.title}
${context.topic.background ? `背景：${context.topic.background}` : ''}
${context.topic.description ? `描述：${context.topic.description}` : ''}`);

    // 添加当前轮次信息
    parts.push(`当前是第 ${context.currentRound}/${context.totalRounds} 轮辩论`);

    // 添加历史发言
    if (context.previousSpeeches.length > 0) {
      parts.push('历史发言：\n' + context.previousSpeeches.map(speech => 
        `[${new Date(speech.timestamp).toLocaleTimeString()}] ${speech.content}`
      ).join('\n'));
    }

    return parts.join('\n\n');
  }

  /**
   * 生成输入提示词
   */
  private generateInputPrompt(): string {
    return `请基于当前辩论主题和历史发言，生成一段有理有据的辩论发言。
在发言前，请先用<think>标签展示你的思考过程，然后再给出正式发言。

示例格式：
<think>
1. 分析当前论点...
2. 考虑反驳策略...
3. 组织论据...
</think>

[正式发言内容]`;
  }

  /**
   * 生成辩论发言
   */
  public async generateSpeech(request: DebateRequest): Promise<DebateResponse> {
    console.group('=== 生成辩论发言 ===');
    console.log('请求参数:', request);

    try {
      const adaptedConfig = adaptModelConfig(request.debater.modelConfig);
      console.log('适配后的模型配置:', adaptedConfig);

      const provider = await this.llmService.getInitializedProvider(adaptedConfig);
      const response = await provider.chat({
        message: this.generateInputPrompt(),
        systemPrompt: this.generateSystemPrompt(request),
        temperature: adaptedConfig.parameters.temperature,
        maxTokens: adaptedConfig.parameters.maxTokens,
        topP: adaptedConfig.parameters.topP
      });

      console.log('LLM响应:', response);

      // 解析响应内容
      const { content, reasoningContent } = this.parseResponse(response.content);

      return {
        content,
        reasoningContent,
        metadata: response.metadata
      };
    } catch (error) {
      console.error('生成发言失败:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }

  /**
   * 生成流式辩论发言
   */
  public async *generateSpeechStream(request: DebateRequest): AsyncGenerator<string> {
    console.group('=== 生成流式辩论发言 ===');
    console.log('请求参数:', request);

    try {
      const adaptedConfig = adaptModelConfig(request.debater.modelConfig);
      console.log('适配后的模型配置:', adaptedConfig);

      const provider = await this.llmService.getInitializedProvider(adaptedConfig);
      const stream = provider.stream({
        message: this.generateInputPrompt(),
        systemPrompt: this.generateSystemPrompt(request),
        temperature: adaptedConfig.parameters.temperature,
        maxTokens: adaptedConfig.parameters.maxTokens,
        topP: adaptedConfig.parameters.topP
      });

      for await (const response of stream) {
        yield response.content ?? '';
      }
    } catch (error) {
      console.error('生成流式发言失败:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }

  /**
   * 解析响应内容
   */
  private parseResponse(content: string | null): { content: string; reasoningContent?: string } {
    if (!content) {
      return { content: '' };
    }

    const thinkMatch = content.match(/<think>(.*?)<\/think>/s);
    if (thinkMatch) {
      const reasoningContent = thinkMatch[1].trim();
      const mainContent = content.replace(/<think>.*?<\/think>/s, '').trim();
      return {
        content: mainContent || '',
        reasoningContent
      };
    }

    return { content: content.trim() };
  }

  async *generateStreamResponse(request: ChatRequest): AsyncGenerator<string> {
    try {
      const stream = await this.llmService.stream(request);

      for await (const response of stream) {
        yield response.content ?? '';
      }
    } catch (error) {
      console.error('生成流式发言失败:', error);
      throw error;
    }
  }
} 