import { ModelConfig } from '../../model/types';

export interface Character {
  id: string;
  name: string;
  isAI: boolean;
  role: 'debater' | 'judge' | 'timekeeper';
  config: {
    modelId: string;
    parameters?: ModelConfig['parameters'];
  };
  personality?: string;
  speakingStyle?: string;
  background?: string;
  values?: string[];
  argumentationStyle?: string[];
} 