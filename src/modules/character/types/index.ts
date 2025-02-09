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
      provider: string;
      modelId: string;
      model: string;
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

// 选项常量
export const OPTIONS = {
  personality: [
    '严谨', '幽默', '激进', '保守', '理性', '感性', '务实',
    '理想主义', '创新', '传统'
  ],
  speakingStyle: [
    '平民化', '学术派', '专业化', '通俗易懂', '严肃正式', '轻松活泼'
  ],
  background: [
    '法律', '经济', '科技', '医学', '教育', '艺术', '哲学',
    '社会学', '心理学', '环境科学'
  ],
  values: [
    '功利主义', '人文主义', '环保主义', '科技进步', '传统价值',
    '创新精神', '社会公平', '个人自由'
  ],
  argumentationStyle: [
    '数据驱动', '案例引用', '类比论证', '逻辑推理', '经验总结',
    '权威引用', '实验论证', '历史分析'
  ]
} as const;

// 类型
export type Personality = typeof OPTIONS.personality[number];
export type SpeakingStyle = typeof OPTIONS.speakingStyle[number];
export type Background = typeof OPTIONS.background[number];
export type Value = typeof OPTIONS.values[number];
export type ArgumentationStyle = typeof OPTIONS.argumentationStyle[number];

export * from './character';
export * from './template'; 