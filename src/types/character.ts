import type { CharacterConfig } from '../modules/character/types';

export interface CharacterState {
  characters: CharacterConfig[];
  templates: CharacterConfig[];
  activeMode: 'dify' | 'direct';
  difyConfig: {
    serverUrl: string;
    apiKey: string;
    workflowId: string;
    parameters: Record<string, any>;
  };
  directConfig: {
    provider: string;
    apiKey: string;
    model: string;
    parameters: Record<string, any>;
  };
}

export type CharacterStateStorage = CharacterState; 