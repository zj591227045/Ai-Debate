import { BaseStore } from '../core/BaseStore';
import { StateContainerFactory } from '../core/StateContainer';
import { SessionState, DebateStatus } from '@state/types/adapters';
import { StoreConfig } from '@state/types/store';

const DEFAULT_CONFIG: StoreConfig = {
  namespace: 'session',
  version: '1.0.0',
  persistence: {
    enabled: true,
    storage: 'local'
  }
};

/**
 * 会话状态管理器
 */
export class SessionStore extends BaseStore<SessionState> {
  constructor() {
    super(DEFAULT_CONFIG);
  }

  protected createInitialState() {
    const initialState: SessionState = {
      configState: {
        activeConfig: {
          debate: {
            topic: {
              title: '',
              description: '',
              rounds: 0
            },
            rules: {
              debateFormat: 'structured',
              description: '',
              advancedRules: {
                speechLengthLimit: {
                  min: 100,
                  max: 1000
                },
                allowQuoting: true,
                requireResponse: true,
                allowStanceChange: false,
                requireEvidence: true
              }
            },
            judging: {
              description: '',
              dimensions: [],
              totalScore: 100
            }
          },
          players: [],
          isConfiguring: true
        },
        savedConfigs: [],
        lastModified: Date.now()
      },
      debateState: {
        status: DebateStatus.PREPARING,
        progress: {
          currentRound: 1,
          currentSpeaker: '',
          remainingTime: 0,
          completionPercentage: 0
        },
        history: {
          speeches: [],
          scores: []
        },
        players: [],
        currentSpeaker: null,
        streamingSpeech: null
      },
      uiState: {
        isLoading: false,
        isDarkMode: false,
        playerListWidth: 300
      },
      timestamp: Date.now()
    };

    return StateContainerFactory.create(
      initialState,
      this.namespace,
      this.version
    );
  }

  protected validateState(state: Partial<SessionState>): boolean {
    // 基本验证：确保必要的字段存在
    return !!(
      state &&
      state.configState &&
      state.debateState &&
      state.uiState &&
      state.timestamp
    );
  }
} 