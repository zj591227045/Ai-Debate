export const DebateStatus = {
  PREPARING: 'preparing',
  ONGOING: 'ongoing',
  IN_PROGRESS: 'ongoing',
  PAUSED: 'paused',
  ROUND_COMPLETE: 'roundComplete',
  SCORING: 'scoring',
  COMPLETED: 'completed'
} as const;

export type DebateStatus = typeof DebateStatus[keyof typeof DebateStatus];

export interface SessionState {
  configState: {
    activeConfig: {
      debate: {
        topic: {
          title: string;
          description: string;
          rounds: number;
        };
        rules: {
          debateFormat: string;
          description: string;
          advancedRules: {
            speechLengthLimit: {
              min: number;
              max: number;
            };
            allowQuoting: boolean;
            requireResponse: boolean;
            allowStanceChange: boolean;
            requireEvidence: boolean;
          };
        };
        judging: {
          description: string;
          dimensions: any[];
          totalScore: number;
        };
      };
      players: any[];
      isConfiguring: boolean;
    };
    savedConfigs: any[];
    lastModified: number;
  };
  debateState: {
    status: DebateStatus;
    progress: {
      currentRound: number;
      currentSpeaker: string;
      remainingTime: number;
      completionPercentage: number;
    };
    history: {
      speeches: any[];
      scores: any[];
    };
    players: any[];
    currentSpeaker: any;
    streamingSpeech: any;
  };
  uiState: {
    isLoading: boolean;
    isDarkMode: boolean;
    playerListWidth: number;
  };
  timestamp: number;
} 