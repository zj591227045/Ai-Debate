import type { Player } from '../../game-config/types';
import type { Speech } from '@debate/types';
import type { ProcessedSpeech, ScoringContext, JudgeConfig } from '../types/interfaces';

export interface DebateContext {
  topic: {
    title: string;
    background?: string;
  };
  currentRound: number;
  totalRounds: number;
  previousSpeeches: Speech[];
}

export class PromptService {
  // 生成内心OS的系统提示词
  generateInnerThoughtsSystemPrompt(player: Player): string {
    return `你是一位专业的辩论选手，现在需要你以思考者的身份，分析当前辩论局势并思考策略。

你的角色信息：
- 姓名：${player.name}
- 性格：${player.personality || '未指定'}
- 说话风格：${player.speakingStyle || '未指定'}
- 专业背景：${player.background || '未指定'}
- 价值观：${player.values || '未指定'}
- 论证风格：${player.argumentationStyle || '未指定'}`;
  }

  // 生成内心OS的人类提示词
  generateInnerThoughtsHumanPrompt(context: DebateContext): string {
    const { topic, currentRound, totalRounds, previousSpeeches } = context;
    
    return `当前辩论信息：
- 主题：${topic.title}
${topic.background ? `- 背景：${topic.background}` : ''}
- 当前轮次：${currentRound}/${totalRounds}
${previousSpeeches.length > 0 ? `- 已有发言：\n${previousSpeeches.map(speech => 
  `[${speech.playerId}]: ${speech.content}`
).join('\n')}` : ''}

请以内心独白的方式，分析当前局势并思考下一步策略。注意：
1. 保持角色特征的一致性
2. 分析其他选手的论点优劣
3. 思考可能的反驳方向
4. 规划下一步的论证策略`;
  }

  // 生成正式发言的系统提示词
  generateSpeechSystemPrompt(player: Player): string {
    return `你是一位专业的辩论选手，现在需要你基于之前的思考，生成正式的辩论发言。

你的角色信息：
- 姓名：${player.name}
- 性格：${player.personality || '未指定'}
- 说话风格：${player.speakingStyle || '未指定'}
- 专业背景：${player.background || '未指定'}
- 价值观：${player.values || '未指定'}
- 论证风格：${player.argumentationStyle || '未指定'}`;
  }

  // 生成正式发言的人类提示词
  generateSpeechHumanPrompt(context: DebateContext, innerThoughts: string): string {
    const { topic, currentRound, totalRounds, previousSpeeches } = context;
    
    return `当前辩论信息：
- 主题：${topic.title}
${topic.background ? `- 背景：${topic.background}` : ''}
- 当前轮次：${currentRound}/${totalRounds}
${previousSpeeches.length > 0 ? `- 已有发言：\n${previousSpeeches.map(speech => 
  `[${speech.playerId}]: ${speech.content}`
).join('\n')}` : ''}

你的内心思考：
${innerThoughts}

请基于以上信息，生成正式的辩论发言。要求：
1. 保持角色特征的一致性
2. 论述要有理有据
3. 适当回应其他选手的观点
4. 展现个人特色和风格`;
  }

  // 生成评分的系统提示词
  generateScoringSystemPrompt(judge: JudgeConfig): string {
    return `你是一位专业的辩论赛评委，需要以特定的评委身份对辩手的发言进行评分和点评。

你的身份信息：
姓名：${judge.name}
${judge.characterConfig ? `
性格特征：${judge.characterConfig.personality || ''}
说话风格：${judge.characterConfig.speakingStyle || ''}
专业背景：${judge.characterConfig.background || ''}
价值观：${judge.characterConfig.values?.join('、') || ''}
论证风格：${judge.characterConfig.argumentationStyle || ''}
` : ''}

评分维度包括：
- 逻辑性（30分）：论证的逻辑严密程度
- 论据支持（30分）：论据的充分性和相关性
- 表达能力（20分）：语言表达的清晰度和说服力
- 反驳能力（20分）：对对方论点的反驳效果

请以你的评委身份，按照以下JSON格式输出评分结果：
{
  "dimensions": {
    "logic": <0-30的整数>,
    "evidence": <0-30的整数>,
    "delivery": <0-20的整数>,
    "rebuttal": <0-20的整数>
  },
  "feedback": {
    "strengths": string[],    // 3-5个优点
    "weaknesses": string[],   // 2-3个不足
    "suggestions": string[]   // 1-2个建议
  },
  "comment": string          // 总体评语，不超过300字
}`;
  }

  // 生成评分的人类提示词
  generateScoringHumanPrompt(speech: ProcessedSpeech, context: ScoringContext): string {
    const topic = context.rules.dimensions.find(d => d.name === 'topic')?.description || '未提供主题';
    
    return `请以评委身份对以下辩论发言进行评分：

辩论主题：${topic}
当前轮次：第${speech.round}轮
发言内容：
${speech.content}

请严格按照系统提示的JSON格式输出评分结果。评语要体现你的个性特征和价值观。`;
  }

  // 生成内心独白的系统提示词
  generateInnerThoughtsPrompt(characterId: string): string {
    return `你是一位专业的辩论选手，现在需要生成内心独白，分析当前局势和策略。
请以第一人称的方式，表达你对当前辩论形势的思考和下一步的策略规划。
要体现出你的个性特征和思维方式。`;
  }

  // 生成正式发言的系统提示词
  generateSpeechPrompt(characterId: string): string {
    return `你是一位专业的辩论选手，现在需要生成正式的辩论发言。
请保持逻辑严密，论据充分，语言精炼有力。
要体现出你的辩论风格和价值观。`;
  }
} 