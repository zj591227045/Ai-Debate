import { BaseStore } from '../core/BaseStore';
import { StateContainerFactory } from '../core/StateContainer';
import type { ModelState } from '../types/state';
import type { ModelStore as IModelStore } from '../types/stores';
import { ModelConfig } from '../../model/types/config';

const MODEL_STORAGE_KEY = 'model_configs';

/**
 * 模型存储类
 */
export class ModelStore extends BaseStore<ModelState> implements IModelStore {
  protected data: ModelState;
  protected metadata: { lastUpdated: number };
  private models: Map<string, ModelConfig>;

  constructor(config: {
    namespace: string;
    version: string;
    persistence?: {
      enabled: boolean;
      key?: string;
      storage?: 'local' | 'session' | 'memory';
    };
    storageAdapter?: any;
  }) {
    super(config);
    this.metadata = { lastUpdated: Date.now() };
    this.data = this.createInitialState().data;
    this.models = new Map();
    this.loadFromStorage();
  }

  /**
   * 从LocalStorage加载数据
   */
  private loadFromStorage(): void {
    try {
      const storedData = localStorage.getItem(MODEL_STORAGE_KEY);
      if (storedData) {
        const configs: ModelConfig[] = JSON.parse(storedData);
        configs.forEach(config => {
          this.models.set(config.id, config);
        });
        console.log('从存储加载模型配置:', configs);
      }
    } catch (err) {
      console.error('加载模型配置失败:', err);
    }
  }

  /**
   * 保存到LocalStorage
   */
  private saveToStorage(): void {
    try {
      const configs = Array.from(this.models.values());
      localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(configs));
      console.log('保存模型配置到存储:', configs);
    } catch (err) {
      console.error('保存模型配置失败:', err);
    }
  }

  /**
   * 创建初始状态
   */
  protected createInitialState() {
    const initialState: ModelState = {
      currentModel: '',
      config: {
        temperature: 0.7,
        maxTokens: 2048
      },
      availableModels: []
    };

    return StateContainerFactory.create(
      initialState,
      this.namespace,
      this.version
    );
  }

  /**
   * 验证状态
   */
  protected validateState(state: ModelState): boolean {
    return true; // 简化验证，实际应该添加详细的验证逻辑
  }

  /**
   * 获取所有模型
   */
  public async getAll(): Promise<ModelState['availableModels']> {
    return this.getState().availableModels;
  }

  /**
   * 根据ID获取模型
   */
  public async getById(id: string) {
    return this.getState().availableModels.find(model => model.id === id);
  }

  /**
   * 添加模型
   */
  public async addModel(model: any) {
    const state = this.getState();
    this.setState({
      availableModels: [...state.availableModels, model]
    });
    return model.id;
  }

  /**
   * 更新模型
   */
  public async updateModel(id: string, model: any) {
    const state = this.getState();
    this.setState({
      availableModels: state.availableModels.map(m => 
        m.id === id ? { ...m, ...model } : m
      )
    });
  }

  /**
   * 删除模型
   */
  public async deleteModel(id: string) {
    const state = this.getState();
    this.setState({
      availableModels: state.availableModels.filter(m => m.id !== id)
    });
  }

  /**
   * 切换模型启用状态
   */
  public async toggleEnabled(id: string, isEnabled: boolean) {
    const state = this.getState();
    this.setState({
      availableModels: state.availableModels.map(m =>
        m.id === id ? { ...m, isEnabled } : m
      )
    });
  }

  /**
   * 设置当前模型
   */
  setCurrentModel(modelId: string): void {
    const model = Array.from(this.models.values()).find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model with id "${modelId}" not found`);
    }
    this.setState({ currentModel: modelId });
  }

  /**
   * 更新模型配置
   */
  updateConfig(config: Partial<ModelState['config']>): void {
    this.setState({
      config: { ...this.state.data.config, ...config }
    });
  }

  /**
   * 设置可用模型列表
   * @param models 模型列表
   */
  public setAvailableModels(models: ModelState['availableModels']): void {
    this.setState({ availableModels: models });
  }

  /**
   * 添加可用模型
   * @param model 模型信息
   */
  public addAvailableModel(model: ModelState['availableModels'][0]): void {
    if (this.state.data.availableModels.some(m => m.id === model.id)) {
      throw new Error(`Model with id "${model.id}" already exists`);
    }
    this.setState({
      availableModels: [...this.state.data.availableModels, model]
    });
  }

  /**
   * 移除可用模型
   * @param modelId 模型ID
   */
  public removeAvailableModel(modelId: string): void {
    this.setState({
      availableModels: this.state.data.availableModels.filter(m => m.id !== modelId)
    });
  }

  /**
   * 获取当前模型信息
   */
  public getCurrentModelInfo() {
    return this.state.data.availableModels.find(
      m => m.id === this.state.data.currentModel
    );
  }

  /**
   * 获取所有模型配置
   */
  async getAllConfigs(): Promise<ModelConfig[]> {
    return Array.from(this.models.values());
  }

  /**
   * 获取指定ID的模型配置
   */
  async getConfigById(id: string): Promise<ModelConfig | null> {
    return this.models.get(id) || null;
  }

  /**
   * 添加新的模型配置
   */
  async addConfig(config: ModelConfig): Promise<void> {
    this.models.set(config.id, config);
    this.saveToStorage();
  }

  /**
   * 更新模型配置
   */
  async updateConfigById(id: string, config: ModelConfig): Promise<void> {
    if (!this.models.has(id)) {
      throw new Error(`Model ${id} not found`);
    }
    this.models.set(id, config);
    this.saveToStorage();
  }

  /**
   * 删除模型配置
   */
  async deleteConfig(id: string): Promise<void> {
    this.models.delete(id);
    this.saveToStorage();
  }
} 