/**
 * 辩论服务实现
 */

import { UnifiedLLMService } from '../../llm/services/UnifiedLLMService';
import { LLMRequest } from '../../llm/types';
import { DebateService as IDebateService, DebateRequest, DebateResponse } from '../types';
import { adaptModelConfig } from '../../llm/utils/adapters';

export class DebateService implements IDebateService {
  private static instance: DebateService;
  private llmService: UnifiedLLMService;

  private constructor() {
    this.llmService = new UnifiedLLMService();
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

      const llmRequest: LLMRequest = {
        prompt: this.generateSystemPrompt(request),
        input: this.generateInputPrompt(),
        modelConfig: adaptedConfig
      };

      console.log('LLM请求:', llmRequest);
      const response = await this.llmService.generateCompletion(llmRequest);
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

      const llmRequest: LLMRequest = {
        prompt: this.generateSystemPrompt(request),
        input: this.generateInputPrompt(),
        modelConfig: adaptedConfig,
        parameters: {
          ...adaptedConfig.parameters,
          stream: true
        }
      };

      console.log('LLM流式请求:', llmRequest);
      const stream = await this.llmService.generateStream(llmRequest);

      if (!stream) {
        throw new Error('模型不支持流式输出');
      }

      for await (const chunk of stream) {
        yield chunk;
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
  private parseResponse(text: string): { content: string; reasoningContent?: string } {
    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
    const reasoningContent = thinkMatch ? thinkMatch[1].trim() : undefined;
    const content = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();

    return {
      content,
      reasoningContent
    };
  }
} 