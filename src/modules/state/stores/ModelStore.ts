import { BaseStore } from '../core/BaseStore';
import { StateContainerFactory } from '../core/StateContainer';
import type { ModelState } from '../types/state';

/**
 * 模型存储类
 */
export class ModelStore extends BaseStore<ModelState> {
  protected data: ModelState;
  protected metadata: { lastUpdated: number };

  constructor(config: any) {
    super(config);
    this.metadata = { lastUpdated: Date.now() };
    this.data = this.createInitialState().data;
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
   * @param modelId 模型ID
   */
  public setCurrentModel(modelId: string): void {
    const model = this.state.data.availableModels.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model with id "${modelId}" not found`);
    }
    this.setState({ currentModel: modelId });
  }

  /**
   * 更新模型配置
   * @param config 配置更新
   */
  public updateConfig(config: Partial<ModelState['config']>): void {
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
} 