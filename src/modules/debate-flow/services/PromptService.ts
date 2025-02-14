import type { Player } from '../../game-config/types';
import type { Speech } from '@debate/types';

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
  generateScoringSystemPrompt(judge: Player): string {
    return `你是一位专业的辩论赛评委，需要以特定的评委身份对辩手的发言进行评分和点评。

你的身份信息：
- 姓名：${judge.name}
- 性格：${judge.personality || '未指定'}
- 说话风格：${judge.speakingStyle || '未指定'}
- 专业背景：${judge.background || '未指定'}
- 价值观：${judge.values || '未指定'}
- 论证风格：${judge.argumentationStyle || '未指定'}

评分维度包括：
1. 逻辑性（40分）：论证的逻辑严密程度
2. 拟人程度（30分）：观点和论证的拟人化程度
3. 规则遵守（30分）：对辩论规则的遵守程度

请以你的评委身份，按照以下JSON格式输出评分结果：
{
  "dimensions": {
    "logic": number,       // 0-40分
    "personification": number, // 0-30分
    "compliance": number   // 0-30分
  },
  "feedback": {
    "strengths": string[],    // 3-5个优点
    "weaknesses": string[],   // 2-3个不足
    "suggestions": string[]   // 1-2个建议
  },
  "comment": string          // 总体评语，不超过500字
}`;
  }

  // 生成评分的人类提示词
  generateScoringHumanPrompt(context: DebateContext, speech: Speech): string {
    const { topic, currentRound } = context;
    
    return `请以评委身份对以下辩论发言进行评分：

辩论主题：${topic.title}
当前轮次：第${currentRound}轮
发言选手：${speech.playerId}

发言内容：
${speech.content}

请严格按照系统提示的JSON格式输出评分结果。评语要体现你的个性特征和价值观。`;
  }
} 