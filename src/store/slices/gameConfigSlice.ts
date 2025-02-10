import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GameConfigState } from '../../types/config';
import type { TopicConfig, RuleConfig, DebateConfig } from '../unified/types';
import type { Player } from '../../types/player';

const initialState: GameConfigState = {
  settings: {
    roundCount: 3,
    timeLimit: 300,
    language: 'zh-CN',
    dify: {
      serverUrl: '',
      apiKey: '',
      workflowId: '',
      parameters: {}
    },
    direct: {
      provider: 'openai',
      apiKey: '',
      model: 'gpt-3.5-turbo',
      parameters: {}
    }
  },
  roles: {
    affirmative: [],
    negative: []
  },
  topic: {
    title: '',
    description: '',
    type: 'binary' as const
  },
  rules: {
    format: 'structured' as const,
    timeLimit: 300,
    totalRounds: 3,
    debateFormat: 'structured' as const,
    description: '标准辩论规则',
    basicRules: {
      speechLengthLimit: {
        min: 60,
        max: 300
      },
      allowEmptySpeech: false,
      allowRepeatSpeech: false
    },
    advancedRules: {
      allowQuoting: true,
      requireResponse: true,
      allowStanceChange: false,
      requireEvidence: true,
      minLength: 100,
      maxLength: 1000
    }
  },
  debate: {
    topic: {
      title: '',
      description: '',
      type: 'binary' as const
    },
    rules: {
      format: 'structured' as const,
      timeLimit: 300,
      totalRounds: 3,
      debateFormat: 'structured' as const,
      description: '标准辩论规则',
      basicRules: {
        speechLengthLimit: {
          min: 60,
          max: 300
        },
        allowEmptySpeech: false,
        allowRepeatSpeech: false
      },
      advancedRules: {
        allowQuoting: true,
        requireResponse: true,
        allowStanceChange: false,
        requireEvidence: true,
        minLength: 100,
        maxLength: 1000
      }
    },
    judging: {
      dimensions: [],
      totalScore: 100,
      description: ''
    },
    players: {
      byId: {}
    }
  },
  players: [],
  ruleConfig: {
    format: 'structured' as const,
    timeLimit: 300,
    totalRounds: 3,
    debateFormat: 'structured' as const,
    description: '标准辩论规则',
    basicRules: {
      speechLengthLimit: {
        min: 60,
        max: 300
      },
      allowEmptySpeech: false,
      allowRepeatSpeech: false
    },
    advancedRules: {
      allowQuoting: true,
      requireResponse: true,
      allowStanceChange: false,
      requireEvidence: true,
      minLength: 100,
      maxLength: 1000
    }
  },
  isConfiguring: true
};

const gameConfigSlice = createSlice({
  name: 'gameConfig',
  initialState,
  reducers: {
    setGameConfig: (state, action: PayloadAction<GameConfigState>) => {
      return action.payload;
    },
    updateDebateConfig: (state, action: PayloadAction<Partial<DebateConfig>>) => {
      if (action.payload.topic) {
        state.debate.topic = {
          ...state.debate.topic,
          ...action.payload.topic
        };
        // 同步更新顶层 topic
        state.topic = {
          ...action.payload.topic,
          type: 'binary'
        };
      }
      if (action.payload.rules) {
        const rules: RuleConfig = {
          ...state.debate.rules,
          ...action.payload.rules,
          format: action.payload.rules.format || state.debate.rules.format,
          timeLimit: action.payload.rules.timeLimit || state.debate.rules.timeLimit,
          totalRounds: action.payload.rules.totalRounds || state.debate.rules.totalRounds
        };
        state.debate.rules = rules;
        // 同步更新顶层 rules
        state.rules = rules;
      }
      if (action.payload.judging) {
        state.debate.judging = {
          ...state.debate.judging,
          ...action.payload.judging
        };
      }
    },
    updatePlayers: (state, action: PayloadAction<Player[]>) => {
      state.players = action.payload;
    },
    updateRuleConfig: (state, action: PayloadAction<RuleConfig>) => {
      state.ruleConfig = action.payload;
      // 同步更新 debate.rules
      state.debate.rules = {
        ...state.debate.rules,
        ...action.payload
      };
      // 同步更新顶层 rules
      state.rules = {
        ...state.rules,
        ...action.payload
      };
    },
    setConfiguring: (state, action: PayloadAction<boolean>) => {
      state.isConfiguring = action.payload;
    },
    clearGameConfig: () => initialState
  }
});

export const {
  setGameConfig,
  updateDebateConfig,
  updatePlayers,
  updateRuleConfig,
  setConfiguring,
  clearGameConfig
} = gameConfigSlice.actions;

export default gameConfigSlice.reducer; 