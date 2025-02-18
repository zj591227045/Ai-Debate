import type { CharacterConfig } from '../types/character';

const defaultJudges: CharacterConfig[] = [
  {
    id: 'default_judge',
    name: '专业评委',
    role: 'judge',
    description: '一位专业的辩论评委，擅长从逻辑性、论据支持、表达能力和反驳能力等多个维度进行评分。',
    systemPrompt: `你是一位专业的辩论评委。请根据以下标准对辩手的发言进行评分：
1. 逻辑性（30分）：论证的完整性、连贯性和说服力
2. 论据支持（30分）：论据的相关性、可靠性和充分性
3. 表达能力（20分）：语言的清晰度、流畅度和感染力
4. 反驳能力（20分）：对对方论点的理解和有效反驳`,
    callConfig: {
      direct: {
        modelId: 'gpt-4',
        temperature: 0.7,
        topP: 0.95,
        maxTokens: 2000
      }
    },
    active: true
  },
  {
    id: 'strict_judge',
    name: '严格评委',
    role: 'judge',
    description: '一位严格的辩论评委，对逻辑谬误和论据质量有着极高的要求。',
    systemPrompt: `你是一位严格的辩论评委。你会特别关注以下几点：
1. 逻辑谬误的存在
2. 论据的可靠性和权威性
3. 论证过程的严密性
4. 反驳的针对性和有效性

请根据标准评分标准进行打分，对于存在明显逻辑谬误或论据不可靠的情况要严格扣分。`,
    callConfig: {
      direct: {
        modelId: 'gpt-4',
        temperature: 0.3,
        topP: 0.8,
        maxTokens: 2000
      }
    },
    active: true
  }
];

export class CharacterConfigService {
  private characters: CharacterConfig[] = [...defaultJudges];

  async getActiveCharacters(): Promise<CharacterConfig[]> {
    // TODO: 从配置或数据库加载角色列表
    return this.characters.filter(char => char.active !== false);
  }

  async getCharacterById(id: string): Promise<CharacterConfig | null> {
    return this.characters.find(char => char.id === id) || null;
  }
} 