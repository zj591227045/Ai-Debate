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
    const debateConfig: DebateFlowConfig = {
      topic: {
        title: config.topic.title,
        description: config.topic.description,
        rounds: config.topic.rounds
      },
      players: Object.values(config.players).map(player => ({
        id: player.id,
        name: player.name,
        isAI: player.isAI,
        role: player.role,
        team: player.team,
        characterConfig: player.characterId ? {
          id: player.characterId,
          personality: player.personality,
          speakingStyle: player.speakingStyle,
          background: player.background,
          values: player.values ? [player.values] : undefined,
          argumentationStyle: player.argumentationStyle
        } : undefined
      })),
      rules: {
        format: config.rules.debateFormat,
        rounds: config.topic.rounds,
        canSkipSpeaker: config.rules.canSkipSpeaker,
        requireInnerThoughts: config.rules.requireInnerThoughts
      }
    };

    await this.debateFlow.initialize(debateConfig);
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
    const speechInput: SpeechInput = {
      playerId: speech.playerId,
      content: speech.content,
      references: speech.references || [],
      type: speech.type as 'speech' | 'innerThoughts' | 'system'
    };
    await this.debateFlow.submitSpeech(speechInput);
  }

  getCurrentState(): DebateFlowState {
    return this.debateFlow.getCurrentState();
  }

  subscribeToStateChange(handler: (state: DebateFlowState) => void): () => void {
    return this.debateFlow.subscribeToStateChange(handler);
  }

  async skipCurrentSpeaker(): Promise<void> {
    await this.debateFlow.skipCurrentSpeaker();
  }

  async handlePlayerExit(playerId: string): Promise<void> {
    await this.debateFlow.handlePlayerExit(playerId);
  }

  async handlePlayerRejoin(player: PlayerConfig): Promise<void> {
    await this.debateFlow.handlePlayerRejoin(player);
  }
} 