import { z } from 'zod';

// 角色配置验证模式
export const characterConfigSchema = z.object({
  id: z.string(),
  name: z.string().min(1, '角色名称不能为空'),
  avatar: z.string().optional(),
  description: z.string().optional(),
  
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
      modelId: z.string(),
    }).optional(),
  }),
  
  isTemplate: z.boolean().default(false),
  templateId: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
}).transform((data) => ({
  ...data,
  isTemplate: data.isTemplate ?? false,
}));

// 角色配置类型
export type CharacterConfig = z.infer<typeof characterConfigSchema>;

// 配置选项
export const personalityOptions = [
  '严谨', '理性', '专业', '感性', '富有同理心', '热情',
  '务实', '客观', '灵活', '创新', '幽默', '激进'
] as const;

export const speakingStyleOptions = [
  '学术派', '平民化', '专业化', '幽默风趣', '严肃认真'
] as const;

export const backgroundOptions = [
  '研究学者', '社会工作者', '行业专家', '企业家', '教育工作者',
  '政策分析师', '技术专家', '文化工作者'
] as const;

export const valueOptions = [
  '科学精神', '求真务实', '人文关怀', '社会公平', '效率至上',
  '实用主义', '创新精神', '传统价值'
] as const;

export const argumentationStyleOptions = [
  '数据驱动', '逻辑推理', '案例引用', '情感共鸣', '对比论证',
  '因果论证', '类比论证', '权威引用'
] as const;

// 创建新角色时的默认值
export const defaultCharacterConfig: Partial<CharacterConfig> = {
  isTemplate: false,
}; 