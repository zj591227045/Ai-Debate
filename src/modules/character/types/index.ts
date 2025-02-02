// 角色配置
export interface CharacterConfig {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  
  // 人设配置
  persona: {
    // 性格特征（可多选）
    personality: string[];
    // 说话风格
    speakingStyle: string;
    // 专业背景
    background: string;
    // 价值观（可多选）
    values: string[];
    // 论证风格（可多选）
    argumentationStyle: string[];
    // 自定义人设描述
    customDescription?: string;
  };
  
  // 调用配置
  callConfig: {
    type: 'dify' | 'direct';
    dify?: {
      serverUrl: string;
      apiKey: string;
    };
    direct?: {
      modelId: string;
    };
  };
  
  createdAt?: number;
  updatedAt?: number;
}

// 模型配置
export interface ModelConfig {
  provider: string;
  model: string;
  parameters: {
    temperature: number;
    topP: number;
    maxTokens: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    stop?: string[];
  };
}

// Dify配置
export interface DifyConfig {
  serverUrl: string;
  apiKey: string;
  workflowId: string;
  parameters: Record<string, any>;
}

// 直接API配置
export interface DirectAPIConfig {
  provider: string;
  apiKey: string;
  model: string;
  parameters: Record<string, any>;
}

// 预设模板
export interface CharacterTemplate {
  id: string;
  name: string;
  description: string;
  persona: CharacterConfig['persona'];
  callConfig: CharacterConfig['callConfig'];
}

// 性格特征选项
export const personalityOptions = [
  '严谨', '幽默', '激进', '保守', '理性', 
  '感性', '务实', '理想主义', '创新', '传统'
] as const;

// 说话风格选项
export const speakingStyleOptions = [
  '学术派', '平民化', '专业', '通俗', '正式', 
  '轻松', '严肃', '幽默', '简洁', '详细'
] as const;

// 专业背景选项
export const backgroundOptions = [
  '法律', '经济', '科技', '人文', '医学', 
  '教育', '艺术', '政治', '环境', '社会学'
] as const;

// 价值观选项
export const valueOptions = [
  '功利主义', '人文主义', '环保主义', '科技进步', 
  '传统价值', '创新精神', '社会公平', '个人自由'
] as const;

// 论证风格选项
export const argumentationStyleOptions = [
  '数据驱动', '案例引用', '类比论证', '逻辑推理', 
  '经验总结', '权威引用', '实验论证', '历史分析'
] as const;

// 类型
export type Personality = typeof personalityOptions[number];
export type SpeakingStyle = typeof speakingStyleOptions[number];
export type Background = typeof backgroundOptions[number];
export type Value = typeof valueOptions[number];
export type ArgumentationStyle = typeof argumentationStyleOptions[number];

export * from './character';
export * from './template'; 