import type { ModelConfig } from '../../llm/types/config';

export abstract class BaseConfigFactory {
  abstract createInitialConfig(): ModelConfig;
  abstract validateConfig(config: ModelConfig): string[];
} 