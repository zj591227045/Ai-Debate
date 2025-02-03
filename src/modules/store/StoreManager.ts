import { ModelStore } from './ModelStore';
import { GameRulesStore } from './GameRulesStore';

export class StoreManager {
  private static instance: StoreManager;
  private modelStore: ModelStore;
  private gameRulesStore: GameRulesStore;

  private constructor() {
    this.modelStore = new ModelStore();
    this.gameRulesStore = new GameRulesStore();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): StoreManager {
    if (!StoreManager.instance) {
      StoreManager.instance = new StoreManager();
    }
    return StoreManager.instance;
  }

  /**
   * 获取模型存储
   */
  public getModelStore(): ModelStore {
    return this.modelStore;
  }

  /**
   * 获取游戏规则存储
   */
  public getGameRulesStore(): GameRulesStore {
    return this.gameRulesStore;
  }

  /**
   * 初始化所有存储
   */
  public async initialize(): Promise<void> {
    await Promise.all([
      this.gameRulesStore.load(),
      this.modelStore.load()
    ]);
  }

  /**
   * 清理所有存储
   */
  public async clearAll(): Promise<void> {
    await Promise.all([
      this.gameRulesStore.clear(),
      this.modelStore.clear()
    ]);
  }
} 