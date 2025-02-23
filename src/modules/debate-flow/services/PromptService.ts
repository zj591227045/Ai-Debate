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
  private readonly historyManager: DialogueHistoryManager;
  
  constructor(maxHistoryTokens?: number) {
    this.historyManager = new DialogueHistoryManager(maxHistoryTokens);
  }

  private getCharacterPersona(characterId: string) {
    try {
      const characterConfigsStr = localStorage.getItem('character_configs');
      if (!characterConfigsStr) return null;

      const characterConfigs = JSON.parse(characterConfigsStr);
      const character = characterConfigs.find((c: any) => c.id === characterId);
      return character?.persona || null;
    } catch (error) {
      console.error('获取角色配置失败:', error);
      return null;
    }
  }

  private formatPersonalityOrStyle(value: string | string[]): string {
    if (Array.isArray(value)) {
      return value.join('、');
    }
    return value;
  }

  private getCharacterConfig(characterId: string): { id: string; name: string; characterName: string; persona?: { 
    personality?: string;
    speakingStyle?: string;
    background?: string;
    values?: string[];
    argumentationStyle?: string;
    customDescription?: string;
  } } | null {
    try {
      if (!characterId) {
        console.warn('传入的 characterId 为空');
        return null;
      }

      console.log('开始获取角色配置，characterId:', characterId);
      const characterConfigsStr = localStorage.getItem('character_configs');
      console.log('从localStorage获取的character_configs:', characterConfigsStr);
      
      if (!characterConfigsStr) {
        console.warn('未找到character_configs配置');
        return null;
      }

      let characterConfigs;
      try {
        characterConfigs = JSON.parse(characterConfigsStr);
        console.log('解析后的characterConfigs:', characterConfigs);
        
        if (!Array.isArray(characterConfigs)) {
          console.error('character_configs 不是数组格式');
          return null;
        }
      } catch (e) {
        console.error('解析character_configs失败:', e);
        return null;
      }
      
      console.log('开始查找角色配置...');
      const character = characterConfigs.find((c: any) => {
        console.log('正在比较:', { 
          currentId: c.id, 
          targetId: characterId,
          currentName: c.name,
          match: c.id === characterId 
        });
        return c.id === characterId;
      });
      
      if (!character) {
        console.warn('未找到匹配的角色配置');
        return null;
      }
      
      console.log('找到的character配置:', character);

      // 确保必要的字段存在
      if (!character.name) {
        console.warn('角色配置中缺少name字段');
        return null;
      }

      const result = {
        id: character.id,
        name: character.name,
        characterName: character.name,
        persona: character.persona
      };
      
      console.log('返回的角色配置:', result);
      return result;
    } catch (error) {
      console.error('获取角色配置失败:', error);
      return null;
    }
  }

  // 生成内心独白的系统提示词
  generateInnerThoughtsSystemPrompt(player: Player): string {
    console.log('生成内心独白系统提示词 - 输入参数:', {
      player,
      characterId: player.characterId,
      playerName: player.name
    });
    
    // 首先尝试获取角色配置
    const characterConfig = this.getCharacterConfig(player.characterId || '');
    console.log('获取到的characterConfig:', characterConfig);
    
    // 然后获取persona
    const persona = characterConfig?.persona;
    console.log('获取到的persona:', persona);
    
    if (!characterConfig) {
      console.warn('未找到角色配置，使用默认值');
    }

    // 使用角色配置中的name，如果没有则使用player.name
    const characterName = characterConfig?.name || player.name;
    console.log('最终使用的characterName:', characterName);

    // 安全地处理values数组
    const formatValues = (values: string[] | string | undefined): string => {
      if (Array.isArray(values)) {
        return values.join('、');
      }
      if (typeof values === 'string') {
        return values;
      }
      return '逻辑、真理';
    };

    const prompt = `你现在的身份是：
- 姓名：${characterName}
- 性格：${this.formatPersonalityOrStyle(persona?.personality || '理性客观')}
- 说话风格：${persona?.speakingStyle || '严谨专业'}
- 专业背景：${persona?.background || '丰富的思辨经验'}
- 价值观：${formatValues(persona?.values)}
- 思维方式：${this.formatPersonalityOrStyle(persona?.argumentationStyle || '善于分析和推理')}
- 自我认知：${persona?.customDescription || ''}

请始终保持这个角色的特征，以第一人称的视角思考和表达。`;

    console.log('生成的系统提示词:', prompt);
    return prompt;
  }

  // 生成内心独白的人类提示词
  generateInnerThoughtsHumanPrompt(context: DebateContext): string {
    const { topic, currentRound, totalRounds, previousSpeeches } = context;
    
    // 格式化发言记录
    let speechRecords = '';
    if (previousSpeeches.length > 0) {
      // 按轮次分组
      const speechesByRound = previousSpeeches.reduce((acc: any, speech) => {
        if (speech.type !== 'speech') return acc; // 只记录正式发言
        
        if (!acc[speech.round]) {
          acc[speech.round] = [];
        }
        
        // 获取角色配置
        const characterConfig = this.getCharacterConfig(speech.characterId || '');
        
        console.log('【发言记录调试】PromptService - speech对象:', {
          speechId: speech.id,
          characterId: speech.characterId,
          playerId: speech.playerId,
          round: speech.round
        });
        
        acc[speech.round].push({
          name: characterConfig?.name || speech.characterName || '未知角色',
          id: speech.characterId || speech.playerId,
          sequence: speech.sequence || acc[speech.round].length + 1,
          content: speech.content
        });
        return acc;
      }, {});

      // 转换为JSON字符串格式
      speechRecords = Object.entries(speechesByRound)
        .map(([round, speeches]) => {
          return `第${round}轮：${JSON.stringify(speeches, null, 2)}`;
        })
        .join('\n\n');
    }
    
    return `当前场景信息：
- 主题：${topic.title}
- 背景：${topic.description || '无'}
- 当前轮次：${currentRound}/${totalRounds}
- 规则：
${context.rules?.description || '暂无特定规则'}

发言记录：${speechRecords || '暂无'}

请基于你的角色设定，以内心思考的方式分析当前背景、规则、局势并思考下一步策略。注意：
1. 保持你的性格特征和价值观
2. 分析其他参与者的输出内容的优劣（存在已有发言就分析，不存在就直接跳过，不要分析不存在的发言）
3. 思考可能的发言方向
4. 规划下一步的表达策略，不要输出正式发言，应该完全以内心独白的方式表达
5. 表达中仅包含内心独白，不要输出任何超出当前角色设定的内容`;
  }

  // 生成正式发言的系统提示词
  generateSpeechSystemPrompt(player: Player): string {
    console.log('生成正式发言系统提示词 - 输入参数:', {
      player,
      characterId: player.characterId,
      playerName: player.name
    });
    
    // 首先尝试获取角色配置
    const characterConfig = this.getCharacterConfig(player.characterId || '');
    console.log('获取到的characterConfig:', characterConfig);
    
    // 然后获取persona
    const persona = characterConfig?.persona;
    console.log('获取到的persona:', persona);
    
    if (!characterConfig) {
      console.warn('未找到角色配置，使用默认值');
    }

    // 使用角色配置中的name，如果没有则使用player.name
    const characterName = characterConfig?.name || player.name;
    console.log('最终使用的characterName:', characterName);

    // 安全地处理values数组
    const formatValues = (values: string[] | string | undefined): string => {
      if (Array.isArray(values)) {
        return values.join('、');
      }
      if (typeof values === 'string') {
        return values;
      }
      return '逻辑、真理';
    };

    const prompt = `你现在的身份是：
- 姓名：${characterName}
- 性格：${this.formatPersonalityOrStyle(persona?.personality || '理性客观')}
- 说话风格：${persona?.speakingStyle || '严谨专业'}
- 专业背景：${persona?.background || '丰富的思辨经验'}
- 价值观：${formatValues(persona?.values)}
- 思维方式：${this.formatPersonalityOrStyle(persona?.argumentationStyle || '善于分析和推理')}
- 自我认知：${persona?.customDescription || ''}

请始终保持这个角色的特征，以第一人称的视角进行表达。`;

    console.log('生成的系统提示词:', prompt);
    return prompt;
  }

  // 生成正式发言的人类提示词
  generateSpeechHumanPrompt(context: DebateContext, innerThoughts: string): string {
    const { topic, currentRound, totalRounds, previousSpeeches } = context;
    
    // 格式化发言记录
    let speechRecords = '';
    if (previousSpeeches.length > 0) {
      // 按轮次分组
      const speechesByRound = previousSpeeches.reduce((acc: any, speech) => {
        if (speech.type !== 'speech') return acc; // 只记录正式发言
        
        if (!acc[speech.round]) {
          acc[speech.round] = [];
        }
        
        // 获取角色配置
        const characterConfig = this.getCharacterConfig(speech.characterId || '');
        
        acc[speech.round].push({
          name: characterConfig?.name || speech.characterName || '未知角色',
          id: speech.characterId || speech.playerId,
          sequence: speech.sequence || acc[speech.round].length + 1,
          content: speech.content
        });
        return acc;
      }, {});

      // 转换为JSON字符串格式
      speechRecords = Object.entries(speechesByRound)
        .map(([round, speeches]) => {
          return `第${round}轮：${JSON.stringify(speeches, null, 2)}`;
        })
        .join('\n\n');
    }
    
    return `当前场景信息：
- 主题：${topic.title}
- 背景：${topic.description || '无'}
- 当前轮次：${currentRound}/${totalRounds}
- 规则：
${context.rules?.description || '暂无特定规则'}

发言记录：${speechRecords || '暂无'}

你的内心思考：
${innerThoughts}

请基于以上信息以及要求，进行你的表达。要求：
1. 保持你的性格特征和价值观
2. 使用你的说话风格进行发言
3. 发言中展现你的专业背景和知识
4. 完全代入你的角色，按照规定的背景以及规则进行发言
5. 表达中仅包含正式发言，不要输出任何超出当前角色设定的内容`;
  }

  // 生成评分的系统提示词
  generateScoringSystemPrompt(judge: JudgeConfig, rules: ScoringRules, context: ScoringContext): string {
    const dimensionsText = rules.dimensions
      .map((d: ScoringDimension) => `- ${d.name}（权重：${d.weight}）：${d.description}\n  评分标准：${d.criteria.join('、')}`)
      .join('\n');

    const characterConfig = this.getCharacterConfig(judge.id || '');
    const judgeName = characterConfig?.characterName || judge.name;
    const judgePersona = characterConfig?.persona;

    return `你是一位专业的评审，身份信息如下：

姓名：${judgeName}
${judge.characterConfig ? `
性格特征：${judge.characterConfig.personality || ''}
说话风格：${judge.characterConfig.speakingStyle || ''}
专业背景：${judge.characterConfig.background || ''}
价值观：${judge.characterConfig.values?.join('、') || ''}
评判风格：${judge.characterConfig.argumentationStyle || ''}
${judgePersona?.customDescription ? `\n${judgePersona.customDescription}` : ''}
` : ''}

辩论背景信息：
- 主题：${context.topic.title}
- 背景：${context.topic.description || '无'}
- 当前轮次：${context.currentRound}/${context.totalRounds}

辩论规则：
${context.debateRules?.description || '暂无特定规则'}

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
6. 分数部分必须单独成行，每个维度的分数独占一行
7. 评分时要充分考虑辩论主题和规则要求
8. 评分标准要严格遵循每个维度的评分标准`;
  }

  // 生成评分的人类提示词
  generateScoringHumanPrompt(speech: ProcessedSpeech, context: ScoringContext): string {
    return `请对以下辩论发言进行评分：

当前轮次：第${speech.round}轮
发言内容：
${speech.content}

请严格按照系统提示的格式输出评分结果。评语要体现你的个性特征和价值观，并对每个维度的表现进行具体分析。`;
  }
} 