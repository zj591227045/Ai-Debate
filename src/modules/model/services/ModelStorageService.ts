import { ModelConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

const MODEL_CONFIGS_KEY = 'model_configs';

export class ModelStorageService {
  private static instance: ModelStorageService;

  private constructor() {
    console.log('ModelStorageService 实例化');
  }

  public static getInstance(): ModelStorageService {
    console.log('获取 ModelStorageService 实例');
    if (!this.instance) {
      this.instance = new ModelStorageService();
    }
    return this.instance;
  }

  // 获取所有模型配置
  public async getAll(): Promise<ModelConfig[]> {
    console.log('=== ModelStorageService.getAll() 开始执行 ===');
    console.log('当前使用的存储键名:', MODEL_CONFIGS_KEY);
    
    try {
      const configsStr = localStorage.getItem(MODEL_CONFIGS_KEY);
      //console.log('从localStorage获取的原始数据:', configsStr);
      
      if (!configsStr) {
        console.log('localStorage中没有模型配置数据，返回空数组');
        return [];
      }
      
      const parsed = JSON.parse(configsStr);
      //console.log('解析后的数据类型:', typeof parsed);
      //console.log('解析后的数据:', parsed);
      
      // 如果是对象格式，转换为数组
      let configsArray: ModelConfig[] = [];
      if (typeof parsed === 'object' && parsed !== null) {
        if (Array.isArray(parsed)) {
          configsArray = parsed;
        } else {
          // 将对象转换为数组
          configsArray = Object.values(parsed);
        }
      }
      
      //console.log('转换后的数组:', configsArray);
      
      // 验证每个配置是否包含必要的字段
      const validConfigs = configsArray.filter(config => {
        const isValid = config && 
          typeof config === 'object' &&
          'id' in config &&
          'name' in config &&
          'provider' in config &&
          'model' in config;
        
        if (!isValid) {
          console.warn('发现无效的配置项:', config);
        } else {
          //console.log('有效的配置项:', config);
        }
        
        return isValid;
      });
      
      //console.log('过滤后的有效配置数量:', validConfigs.length);
      //console.log('返回的最终配置:', validConfigs);
      return validConfigs;
    } catch (err) {
      console.error('解析模型配置失败:', err);
      return [];
    }
  }

  // 获取单个模型配置
  public async getById(id: string): Promise<ModelConfig | null> {
    const configs = await this.getAll();
    return configs.find(config => config.id === id) || null;
  }

  // 添加新的模型配置
  public async add(config: Omit<ModelConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ModelConfig> {
    const configs = await this.getAll();
    const now = Date.now();
    const newConfig: ModelConfig = {
      ...config,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };
    
    configs.push(newConfig);
    await this.saveConfigs(configs);
    return newConfig;
  }

  // 更新模型配置
  public async update(id: string, config: Partial<ModelConfig>): Promise<ModelConfig> {
    const configs = await this.getAll();
    const index = configs.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Model config with id ${id} not found`);
    }

    const updatedConfig = {
      ...configs[index],
      ...config,
      updatedAt: Date.now()
    };
    configs[index] = updatedConfig;
    await this.saveConfigs(configs);
    return updatedConfig;
  }

  // 删除模型配置
  public async delete(id: string): Promise<void> {
    const configs = await this.getAll();
    const filteredConfigs = configs.filter(config => config.id !== id);
    await this.saveConfigs(filteredConfigs);
  }

  // 切换模型启用状态
  public async toggleEnabled(id: string, isEnabled: boolean): Promise<void> {
    await this.update(id, { isEnabled });
  }

  // 导入配置
  public async importConfigs(configs: ModelConfig[]): Promise<void> {
    await this.saveConfigs(configs);
  }

  // 导出配置
  public async exportConfigs(): Promise<ModelConfig[]> {
    return this.getAll();
  }

  // 保存配置到localStorage
  private async saveConfigs(configs: ModelConfig[]): Promise<void> {
    localStorage.setItem(MODEL_CONFIGS_KEY, JSON.stringify(configs));
  }
} 