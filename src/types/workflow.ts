// 内心OS工作流输入
export interface InnerThoughtInputs {
  characterRole: string;        // 角色设定
  debateContext: string;        // 辩论上下文
  currentSpeech: string;        // 当前发言内容
  speakerRole: string;         // 发言者角色
  historicalSpeeches: {        // 历史发言记录
    speaker: string;
    content: string;
    timestamp: Date;
  }[];
  promptTemplate: string;      // 提示词模板
}

// 发言工作流输入
export interface SpeechInputs {
  characterRole: string;
  debateContext: string;
  previousSpeeches: {
    speaker: string;
    content: string;
    timestamp: Date;
  }[];
  innerThought: string;        // 内心OS结果
  promptTemplate: string;
}

// 评分工作流输入
export interface ScoringInputs {
  debateContext: string;
  allSpeeches: {
    speaker: string;
    content: string;
    timestamp: Date;
  }[];
  scoringCriteria: {
    criteriaName: string;
    weight: number;
  }[];
  promptTemplate: string;
}

// 工作流输入联合类型
export interface DifyWorkflowInputs {
  innerThought: InnerThoughtInputs;
  speech: SpeechInputs;
  scoring: ScoringInputs;
}

// 工作流输出基础接口
export interface WorkflowOutput<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// 内心OS工作流输出
export interface InnerThoughtOutput extends WorkflowOutput {
  data?: {
    thoughts: string;
    strategy: string;
    analysis: string;
  };
}

// 发言工作流输出
export interface SpeechOutput extends WorkflowOutput {
  data?: {
    speech: string;
    arguments: string[];
    references?: string[];
  };
}

// 评分工作流输出
export interface ScoringOutput extends WorkflowOutput {
  data?: {
    scores: {
      criteriaName: string;
      score: number;
      reason: string;
    }[];
    totalScore: number;
    feedback: string;
    suggestions: string[];
  };
}

// 工作流输出联合类型
export type DifyWorkflowOutputs = {
  innerThought: InnerThoughtOutput;
  speech: SpeechOutput;
  scoring: ScoringOutput;
} 
