import { DifyWorkflowInputs } from './workflow';

// Dify API配置
export interface DifyConfig {
  apiKey: string;
  apiEndpoint: string;
  applicationId: string;
}

// Dify API响应基础接口
export interface DifyResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// 工作流类型
export type WorkflowType = 'innerThought' | 'speech' | 'scoring';

// 工作流状态
export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed';

// 工作流配置
export interface WorkflowConfig {
  type: WorkflowType;
  inputs: DifyWorkflowInputs;
  timeout?: number;
  retryStrategy?: {
    maxAttempts: number;
    backoffFactor: number;
    initialDelay: number;
  };
}

// 工作流执行结果
export interface WorkflowResult<T = any> {
  id: string;
  type: WorkflowType;
  status: WorkflowStatus;
  startTime: Date;
  endTime?: Date;
  result?: T;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
} 