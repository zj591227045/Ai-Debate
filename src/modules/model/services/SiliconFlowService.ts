import { LLMError, LLMErrorCode } from '../../llm/types/error';

interface SiliconFlowModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface SiliconFlowUserInfo {
  balance: number;
  created_at: string;
  updated_at: string;
}

export class SiliconFlowService {
  private static instance: SiliconFlowService;

  private constructor() {}

  public static getInstance(): SiliconFlowService {
    if (!SiliconFlowService.instance) {
      SiliconFlowService.instance = new SiliconFlowService();
    }
    return SiliconFlowService.instance;
  }

  /**
   * 获取模型列表
   */
  async getModelList(baseUrl: string, apiKey: string): Promise<SiliconFlowModel[]> {
    try {
      const response = await fetch(`${baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`获取模型列表失败: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('获取硅基流动模型列表失败:', error);
      throw new LLMError(
        LLMErrorCode.API_ERROR,
        '获取模型列表失败',
        error as Error
      );
    }
  }

  /**
   * 获取用户信息（包括余额）
   */
  async getUserInfo(baseUrl: string, apiKey: string): Promise<SiliconFlowUserInfo> {
    try {
      const response = await fetch(`${baseUrl}/v1/user/info`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`获取用户信息失败: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        ...data.data,
        balance: Number(data.data.balance) || 0
      };
    } catch (error) {
      console.error('获取硅基流动用户信息失败:', error);
      throw new LLMError(
        LLMErrorCode.API_ERROR,
        '获取用户信息失败',
        error as Error
      );
    }
  }
} 