import type { DebateConfig } from '@game-config/types';
import type { Speech } from '@debate/types';
import { 
  IDebateFlow,
  DebateFlowConfig,
  SpeechInput,
  DebateFlowState,
  PlayerConfig,
  DebateRules
} from '../types/interfaces';
import { DebateFlowService } from '../services/DebateFlowService';
import { LLMService } from '../services/LLMService';
import { SpeakingOrderManager } from '../services/SpeakingOrderManager';
import { SpeechProcessor } from '../services/SpeechProcessor';
import { ScoringSystem } from '../services/ScoringSystem';

export class DebateRoomAdapter {
  private debateFlow: IDebateFlow;

  constructor() {
    const llmService = new LLMService();
    const speakingOrderManager = new SpeakingOrderManager();
    const speechProcessor = new SpeechProcessor();
    const scoringSystem = new ScoringSystem(llmService);
    
    this.debateFlow = new DebateFlowService(
      llmService,
      speakingOrderManager,
      speechProcessor,
      scoringSystem
    );
  }

  async initialize(config: DebateConfig): Promise<void> {
    const adaptedConfig = this.adaptConfig(config);
    await this.debateFlow.initialize(adaptedConfig);
  }

  async startDebate(): Promise<void> {
    await this.debateFlow.startDebate();
  }

  async pauseDebate(): Promise<void> {
    await this.debateFlow.pauseDebate();
  }

  async resumeDebate(): Promise<void> {
    await this.debateFlow.resumeDebate();
  }

  async endDebate(): Promise<void> {
    await this.debateFlow.endDebate();
  }

  async submitSpeech(speech: Speech): Promise<void> {
    const adaptedSpeech = this.adaptSpeech(speech);
    await this.debateFlow.submitSpeech(adaptedSpeech);
  }

  getCurrentState(): DebateFlowState {
    return this.debateFlow.getCurrentState();
  }

  subscribeToStateChange(handler: (state: DebateFlowState) => void): () => void {
    return this.debateFlow.subscribeToStateChange(handler);
  }

  private adaptConfig(config: DebateConfig): DebateFlowConfig {
    return {
      topic: {
        title: config.topic.title,
        description: config.topic.description,
        background: config.topic.background
      },
      players: this.adaptPlayers(config.players),
      rules: this.adaptRules(config.rules),
      judge: config.judge ? {
        id: config.judge.id,
        name: config.judge.name,
        characterConfig: {
          // 适配评委角色配置
        }
      } : undefined
    };
  }

  private adaptPlayers(players: any[]): PlayerConfig[] {
    return players.map(player => ({
      id: player.id,
      name: player.name,
      isAI: player.isAI,
      role: player.role,
      team: player.team,
      characterConfig: player.characterId ? {
        personality: player.personality,
        speakingStyle: player.speakingStyle,
        background: player.background,
        values: player.values,
        argumentationStyle: player.argumentationStyle
      } : undefined
    }));
  }

  private adaptRules(rules: any): DebateRules {
    return {
      format: rules.debateFormat,
      rounds: rules.rounds || 1,
      canSkipSpeaker: rules.canSkipSpeaker,
      requireInnerThoughts: rules.requireInnerThoughts
    };
  }

  private adaptSpeech(speech: Speech): SpeechInput {
    return {
      playerId: speech.playerId,
      content: speech.content,
      type: speech.type || 'speech',
      role: speech.role
    };
  }
} 