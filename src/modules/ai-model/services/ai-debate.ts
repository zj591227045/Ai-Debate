import { ModelProvider } from '../types/providers';
import { Message, ModelParameters } from '../types/common';
import { ApiConfig } from '../types/config';
import { AIModelProviderFactory } from './provider-factory';
import { CharacterConfig } from '../../character/types/character';

export class AIDebateService {
  private providerFactory: AIModelProviderFactory;
  private providers: Map<string, ModelProvider>;

  constructor() {
    this.providerFactory = new AIModelProviderFactory();
    this.providers = new Map();
  }

  private async getProviderForCharacter(character: CharacterConfig): Promise<ModelProvider> {
    const providerId = character.callConfig.direct?.modelId;
    if (!providerId) {
      throw new Error('No model ID configured for character');
    }
    
    let provider = this.providers.get(providerId);
    
    if (!provider) {
      if (!character.callConfig.dify?.apiKey || !character.callConfig.dify?.serverUrl) {
        throw new Error(`Character ${character.name} has incomplete model configuration`);
      }

      const config: ApiConfig = {
        endpoint: character.callConfig.dify.serverUrl,
        apiKey: character.callConfig.dify.apiKey,
        providerSpecific: {}
      };
      
      provider = await this.providerFactory.createProvider(providerId, config);
      this.providers.set(providerId, provider);
    }
    
    return provider;
  }

  async generateInnerThoughts(character: CharacterConfig, context: string): Promise<string> {
    const provider = await this.getProviderForCharacter(character);
    const messages: Message[] = [
      { role: 'system', content: this.generateSystemPrompt(character) },
      { role: 'user', content: `Context: ${context}\nGenerate inner thoughts for the character.` }
    ];
    
    const parameters: ModelParameters = {
      temperature: 0.7,
      maxTokens: 1000
    };
    
    const response = await provider.generateCompletion(messages, parameters);
    return response.content;
  }

  async generateSpeech(character: CharacterConfig, context: string): Promise<string> {
    const provider = await this.getProviderForCharacter(character);
    const messages: Message[] = [
      { role: 'system', content: this.generateSystemPrompt(character) },
      { role: 'user', content: `Context: ${context}\nGenerate a formal speech for the character.` }
    ];
    
    const parameters: ModelParameters = {
      temperature: 0.7,
      maxTokens: 2000
    };
    
    const response = await provider.generateCompletion(messages, parameters);
    return response.content;
  }

  async generateScore(character: CharacterConfig, context: string): Promise<number> {
    const provider = await this.getProviderForCharacter(character);
    const messages: Message[] = [
      { role: 'system', content: this.generateSystemPrompt(character) },
      { role: 'user', content: `Context: ${context}\nScore the debate performance from 0 to 100.` }
    ];
    
    const parameters: ModelParameters = {
      temperature: 0.3,
      maxTokens: 10
    };
    
    const response = await provider.generateCompletion(messages, parameters);
    return parseInt(response.content, 10);
  }

  private generateSystemPrompt(character: CharacterConfig): string {
    return `You are ${character.name}, a debater with the following characteristics:
    
Personality: ${character.persona.personality.join(', ')}
Speaking Style: ${character.persona.speakingStyle}
Background: ${character.persona.background}
Values: ${character.persona.values.join(', ')}
Argumentation Style: ${character.persona.argumentationStyle.join(', ')}

${character.persona.customDescription || ''}

Always stay in character and maintain consistency with these traits in your responses.`;
  }
} 