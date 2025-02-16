import { ModelConfig } from '../../model/types/config';

/**
 * 模型存储接口
 */
export interface ModelStore {
  /**
   * 获取所有模型配置
   */
  getAllConfigs(): Promise<ModelConfig[]>;

  /**
   * 获取指定ID的模型配置
   */
  getConfigById(id: string): Promise<ModelConfig | null>;

  /**
   * 添加新的模型配置
   */
  addConfig(config: ModelConfig): Promise<void>;

  /**
   * 更新模型配置
   */
  updateConfigById(id: string, config: ModelConfig): Promise<void>;

  /**
   * 删除模型配置
   */
  deleteConfig(id: string): Promise<void>;
} 