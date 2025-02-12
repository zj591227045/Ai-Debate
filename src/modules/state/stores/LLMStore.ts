import { BaseStore } from '../core/BaseStore';
import { LLMEvents } from '../../llm/api/events';
import type { LLMState, ServiceStatus } from '../types/llm';
import type { StateContainer, StoreConfig } from '../types';
import { moduleEventBus } from '../../llm/services/events';

const DEFAULT_CONFIG: StoreConfig = {
  namespace: 'llm',
  version: '1.0.0',
  persistence: {
    enabled: true,
    storage: 'local'
  }
};

/**
 * LLM状态管理器
 */
export class LLMStore extends BaseStore<LLMState> {
  constructor() {
    super(DEFAULT_CONFIG);
  }

  protected createInitialState(): StateContainer<LLMState> {
    return {
      data: {
        currentModelId: '',
        providers: new Map(),
        isReady: false,
        config: {
          temperature: 0.7,
          maxTokens: 2048,
          streamingEnabled: true
        }
      },
      metadata: {
        version: this.version,
        lastUpdated: Date.now(),
        namespace: this.namespace
      }
    };
  }

  protected validateState(state: LLMState): boolean {
    return (
      typeof state.currentModelId === 'string' &&
      state.providers instanceof Map &&
      typeof state.isReady === 'boolean' &&
      (!state.config || (
        typeof state.config.temperature === 'number' &&
        typeof state.config.maxTokens === 'number' &&
        typeof state.config.streamingEnabled === 'boolean'
      ))
    );
  }

  /**
   * 设置当前模型
   */
  setCurrentModel(modelId: string): void {
    const currentState = this.getState();
    this.setState({
      currentModelId: modelId,
      isReady: true,
      error: undefined
    });
    moduleEventBus.emit(LLMEvents.MODEL_CHANGED, modelId);
  }

  /**
   * 添加提供商
   */
  addProvider(provider: LLMState['providers']): void {
    const currentState = this.getState();
    this.setState({
      providers: new Map([...currentState.providers, ...provider])
    });
  }

  /**
   * 设置错误状态
   */
  setError(error: string): void {
    this.setState({
      error,
      isReady: false
    });
    moduleEventBus.emit(LLMEvents.ERROR_OCCURRED, new Error(error));
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<NonNullable<LLMState['config']>>): void {
    const currentState = this.getState();
    const currentConfig = currentState.config || {
      temperature: 0.7,
      maxTokens: 2048,
      streamingEnabled: true
    };
    
    this.setState({
      config: {
        ...currentConfig,
        ...config
      }
    });
  }

  /**
   * 获取服务状态
   */
  getServiceStatus(): ServiceStatus {
    const state = this.getState();
    return {
      isReady: state.isReady,
      currentModel: state.currentModelId,
      provider: state.providers.get(state.currentModelId)?.name || '',
      error: state.error
    };
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.setState(this.createInitialState().data);
  }
} 