import { BaseStorageService } from './BaseStorageService';
import { providerConfigSchema, ProviderConfig } from '../validation/schemas/model.schema';

export class ProviderConfigService extends BaseStorageService<ProviderConfig> {
  protected storageKey = 'provider_configs';
  protected schema = providerConfigSchema;

  // 获取启用的供应商
  async getEnabledProviders(): Promise<ProviderConfig[]> {
    const providers = await this.getAll();
    return providers.filter(provider => provider.isEnabled);
  }

  // 启用/禁用供应商
  async toggleProvider(id: string, isEnabled: boolean): Promise<void> {
    const provider = await this.getById(id);
    if (provider) {
      await this.update(id, { ...provider, isEnabled });
    }
  }

  // 更新供应商的模型列表
  async updateModels(id: string, models: string[]): Promise<void> {
    const provider = await this.getById(id);
    if (provider) {
      await this.update(id, { ...provider, models });
    }
  }

  // 更新供应商的基础URL
  async updateBaseUrl(id: string, baseUrl: string): Promise<void> {
    const provider = await this.getById(id);
    if (provider) {
      await this.update(id, { ...provider, defaultBaseUrl: baseUrl });
    }
  }

  // 验证供应商配置是否有效
  async validateProvider(provider: Partial<ProviderConfig>): Promise<boolean> {
    try {
      await this.schema.parseAsync(provider);
      return true;
    } catch {
      return false;
    }
  }
} 