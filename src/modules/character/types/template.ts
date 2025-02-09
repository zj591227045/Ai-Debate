import { z } from 'zod';
import { CharacterConfig } from './character';
import { PROVIDERS } from '../../llm/types/providers';

// 角色模板验证模式
export const characterTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, '模板名称不能为空'),
  description: z.string(),
  persona: z.object({
    personality: z.array(z.string()),
    speakingStyle: z.string(),
    background: z.string(),
    values: z.array(z.string()),
    argumentationStyle: z.array(z.string()),
    customDescription: z.string().optional(),
  }),
  callConfig: z.object({
    type: z.enum(['dify', 'direct']),
    dify: z.object({
      serverUrl: z.string(),
      apiKey: z.string(),
    }).optional(),
    direct: z.object({
      provider: z.string(),
      modelId: z.string(),
      model: z.string()
    }).optional(),
  }),
  isTemplate: z.boolean().default(true),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// 角色模板类型
export type CharacterTemplate = z.infer<typeof characterTemplateSchema>;

// 预设模板列表
export const defaultTemplates: CharacterTemplate[] = [
  {
    id: 'template_1',
    name: '默认模板',
    description: '基础AI角色模板',
    persona: {
      personality: ['理性', '严谨'],
      speakingStyle: '专业化',
      background: '通用',
      values: ['科技进步', '社会公平'],
      argumentationStyle: ['逻辑推理', '数据驱动'],
    },
    callConfig: {
      type: 'direct',
      direct: {
        provider: PROVIDERS.OLLAMA,
        modelId: 'default',
        model: 'default'
      }
    },
    isTemplate: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'template_academic',
    name: '学术型辩手',
    description: '严谨的学术派辩手，擅长使用数据和逻辑论证',
    persona: {
      personality: ['严谨', '理性', '专业'],
      speakingStyle: '学术派',
      background: '研究学者',
      values: ['科学精神', '求真务实'],
      argumentationStyle: ['数据驱动', '逻辑推理'],
      customDescription: '作为一名学术型辩手，我注重论据的可靠性和论证的严密性。',
    },
    callConfig: {
      type: 'direct',
      direct: {
        provider: 'openai',
        modelId: 'gpt4',
        model: 'gpt-4'
      }
    },
    isTemplate: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'template_emotional',
    name: '感性型辩手',
    description: '富有感染力的辩手，善于调动情感共鸣',
    persona: {
      personality: ['感性', '富有同理心', '热情'],
      speakingStyle: '平民化',
      background: '社会工作者',
      values: ['人文关怀', '社会公平'],
      argumentationStyle: ['案例引用', '情感共鸣'],
      customDescription: '我善于通过真实案例和情感共鸣来展开论证。',
    },
    callConfig: {
      type: 'direct',
      direct: {
        provider: 'anthropic',
        modelId: 'claude2',
        model: 'claude-2'
      }
    },
    isTemplate: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'template_pragmatic',
    name: '实用型辩手',
    description: '注重实践的辩手，擅长从现实角度分析问题',
    persona: {
      personality: ['务实', '客观', '灵活'],
      speakingStyle: '专业化',
      background: '行业专家',
      values: ['效率至上', '实用主义'],
      argumentationStyle: ['对比论证', '因果论证'],
      customDescription: '我倾向于从实践和效果的角度来分析问题。',
    },
    callConfig: {
      type: 'direct',
      direct: {
        provider: 'openai',
        modelId: 'gpt4',
        model: 'gpt-4'
      }
    },
    isTemplate: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// 模板转换为角色配置
export const templateToCharacter = (template: CharacterTemplate): Partial<CharacterConfig> => {
  return {
    name: template.name,
    description: template.description,
    persona: template.persona,
    callConfig: template.callConfig,
    isTemplate: false,
    templateId: template.id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

const defaultCallConfig = {
  type: 'direct' as const,
  direct: {
    provider: PROVIDERS.OLLAMA,
    modelId: '',
    model: ''
  }
};