import type { Player } from '../../game-config/types';
import type { Speech } from '@debate/types';
import { 
  ProcessedSpeech, 
  ScoringContext, 
  JudgeConfig,
  DebateContext,
  DebateSceneType,
  ScoringRules,
  ScoringDimension
} from '../types/interfaces';

// 角色特征接口
export interface CharacterTraits {
  personality: string;
  speakingStyle: string;
  background: string;
  values: string[];
  argumentationStyle: string;
}

// 提示词模板接口
export interface PromptTemplate {
  systemPrompt: string;
  humanPrompt: string;
  examples?: string[];
}

// 对话历史接口
export interface DialogueHistory {
  speeches: Speech[];
  currentRound: number;
  totalRounds: number;
}

// 对话历史管理器
export class DialogueHistoryManager {
  private readonly maxTokens: number;
  private readonly tokenizer: (text: string) => number;

  constructor(maxTokens: number = 2048, tokenizer?: (text: string) => number) {
    this.maxTokens = maxTokens;
    this.tokenizer = tokenizer || ((text: string) => text.length / 4); // 简单估算
  }

  // 选择性提取关键对话历史
  selectRelevantHistory(history: DialogueHistory, currentContext: DebateContext): Speech[] {
    const relevantSpeeches: Speech[] = [];
    let totalTokens = 0;

    // 按重要性排序的历史记录
    const sortedSpeeches = this.sortSpeechesByRelevance(history.speeches, currentContext);

    for (const speech of sortedSpeeches) {
      const speechTokens = this.tokenizer(speech.content);
      if (totalTokens + speechTokens > this.maxTokens) {
        break;
      }
      relevantSpeeches.push(speech);
      totalTokens += speechTokens;
    }

    return relevantSpeeches;
  }

  // 根据相关性对历史记录排序
  private sortSpeechesByRelevance(speeches: Speech[], context: DebateContext): Speech[] {
    return speeches.sort((a, b) => {
      // 计算相关性分数
      const scoreA = this.calculateRelevanceScore(a, context);
      const scoreB = this.calculateRelevanceScore(b, context);
      return scoreB - scoreA;
    });
  }

  // 计算单条发言的相关性分数
  private calculateRelevanceScore(speech: Speech, context: DebateContext): number {
    let score = 0;

    // 1. 轮次接近度（越近越重要）
    const roundDiff = context.currentRound - speech.round;
    score += Math.max(0, 5 - roundDiff);

    // 2. 发言类型重要性
    if (speech.type === 'speech') score += 3;
    if (speech.type === 'innerThoughts') score += 1;

    // 3. 当前场景相关性
    if (context.sceneType === DebateSceneType.REBUTTAL) {
      // 在驳论环节，对方最近的论点最重要
      if (speech.type === 'speech' && roundDiff <= 1) {
        score += 4;
      }
    }

    return score;
  }

  // 生成历史摘要
  generateHistorySummary(speeches: Speech[]): string {
    if (speeches.length === 0) return '';

    const summary = speeches.map(speech => {
      const roundInfo = `[第${speech.round}轮]`;
      const typeInfo = speech.type === 'innerThoughts' ? '[内心OS]' : '[发言]';
      return `${roundInfo}${typeInfo} ${speech.playerId}: ${speech.content}`;
    }).join('\n\n');

    return `历史发言摘要：\n${summary}`;
  }
}

export class PromptService {
  private readonly templates: Map<DebateSceneType, PromptTemplate>;
  private readonly historyManager: DialogueHistoryManager;
  
  constructor(maxHistoryTokens?: number) {
    this.templates = new Map();
    this.historyManager = new DialogueHistoryManager(maxHistoryTokens);
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // 开篇立论模板
    this.templates.set(DebateSceneType.OPENING, {
      systemPrompt: `作为一位专业辩手，你需要进行开篇立论。要求：
1. 明确表达立场
2. 提出核心论点
3. 展开论证框架
4. 预设可能的质疑`,
      humanPrompt: `基于以下信息进行开篇立论：
- 辩题：{topic}
- 立场：{stance}
- 背景：{background}

请从以下几个方面展开论述：
1. 立场表明和核心观点
2. 论证框架的搭建
3. 关键论据的展示
4. 可能争议的预设`,
      examples: [
        "示例开篇立论...",
        "示例论证框架..."
      ]
    });

    // 驳论模板
    this.templates.set(DebateSceneType.REBUTTAL, {
      systemPrompt: `作为一位专业辩手，你需要对对方观点进行有力驳斥。要求：
1. 准确抓住对方论点
2. 找出逻辑漏洞
3. 提供反例证据
4. 建立新的论证`,
      humanPrompt: `基于以下信息进行驳论：
- 对方观点：{opponentArgument}
- 我方立场：{stance}
- 已有论据：{previousArguments}

请从以下几个方面展开驳论：
1. 对方论点的问题所在
2. 反驳的具体论据
3. 我方观点的强化
4. 新的论证方向`,
      examples: [
        "示例驳论...",
        "示例反驳策略..."
      ]
    });

    // 其他场景模板...
  }

  // 生成角色化的提示词
  private generateCharacterPrompt(traits: CharacterTraits): string {
    return `你的角色特征：
- 性格特点：${traits.personality}
- 说话风格：${traits.speakingStyle}
- 专业背景：${traits.background}
- 核心价值观：${traits.values.join('、')}
- 论证风格：${traits.argumentationStyle}

请在发言中始终保持以上特征的一致性。`;
  }

  // 获取场景提示词模板
  getSceneTemplate(sceneType: DebateSceneType): PromptTemplate {
    const template = this.templates.get(sceneType);
    if (!template) {
      throw new Error(`未找到场景类型 ${sceneType} 的提示词模板`);
    }
    return template;
  }

  // 生成完整的提示词
  generatePrompt(
    player: Player,
    context: DebateContext,
    previousContent?: string
  ): { systemPrompt: string; humanPrompt: string } {
    // 确保必要的场景信息存在
    if (!context.sceneType) {
      context.sceneType = DebateSceneType.OPENING;
    }
    if (!context.stance) {
      context.stance = 'positive';
    }

    const template = this.getSceneTemplate(context.sceneType);
    const characterTraits: CharacterTraits = {
      personality: player.personality || '理性客观',
      speakingStyle: player.speakingStyle || '严谨专业',
      background: player.background || '专业辩手',
      values: player.values?.split(',') || ['逻辑', '真理'],
      argumentationStyle: player.argumentationStyle || '循证论证'
    };

    // 生成角色提示词
    const characterPrompt = this.generateCharacterPrompt(characterTraits);
    const systemPrompt = `${template.systemPrompt}\n\n${characterPrompt}`;
    
    // 处理对话历史
    const relevantHistory = this.historyManager.selectRelevantHistory(
      {
        speeches: context.previousSpeeches,
        currentRound: context.currentRound,
        totalRounds: context.totalRounds
      },
      context
    );
    
    // 生成基础人类提示词
    let humanPrompt = template.humanPrompt
      .replace('{topic}', context.topic.title)
      .replace('{stance}', context.stance)
      .replace('{background}', context.topic.background || '');

    // 添加历史上下文
    if (relevantHistory.length > 0) {
      humanPrompt += '\n\n' + this.historyManager.generateHistorySummary(relevantHistory);
    }

    // 添加之前的思考（如果有）
    if (previousContent) {
      humanPrompt += `\n\n你之前的思考：\n${previousContent}`;
    }

    return { systemPrompt, humanPrompt };
  }

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
  generateScoringSystemPrompt(judge: JudgeConfig, rules: ScoringRules): string {
    const dimensionsText = rules.dimensions
      .map((d: ScoringDimension) => `- ${d.name}（权重：${d.weight}）：${d.description}\n  评分标准：${d.criteria.join('、')}`)
      .join('\n');

    return `你是一位专业的辩论赛评委，需要以特定的评委身份对辩手的发言进行评分和点评，要使用第一人称角度发言。

你的身份信息：
姓名：${judge.name}
${judge.characterConfig ? `
性格特征：${judge.characterConfig.personality || ''}
说话风格：${judge.characterConfig.speakingStyle || ''}
专业背景：${judge.characterConfig.background || ''}
价值观：${judge.characterConfig.values?.join('、') || ''}
论证风格：${judge.characterConfig.argumentationStyle || ''}
` : ''}

评分维度：
${dimensionsText}

请严格按照以下格式和顺序输出评分结果：

第一部分：总体评价
总评：<此处输入你的总体评价，不超过500字>

第二部分：详细评语
<此处按维度分点输出详细评语，每个维度的评语需要具体分析优缺点>

第三部分：维度评分（注意：分数必须是0-100之间的整数）
${rules.dimensions.map((d: ScoringDimension) => `${d.name}：<分数>`).join('\n')}

注意事项：
1. 必须严格按照上述顺序输出：先输出总评，再输出详细评语，最后输出分数
2. 分数必须是0-100之间的整数
3. 必须包含所有评分维度
4. 评语要体现你的个性特征和价值观
5. 评语要针对每个维度的表现进行具体分析
6. 分数部分必须单独成行，每个维度的分数独占一行`;
  }

  // 生成评分的人类提示词
  generateScoringHumanPrompt(speech: ProcessedSpeech, context: ScoringContext): string {
    return `请对以下辩论发言进行评分：

当前轮次：第${speech.round}轮
发言内容：
${speech.content}

请严格按照系统提示的格式输出评分结果。评语要体现你的个性特征和价值观，并对每个维度的表现进行具体分析。`;
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