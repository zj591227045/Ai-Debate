import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GameConfigState } from '../../types/config';
import type { Player } from '../../types/player';
import type { RuleConfig } from '../../types/rules';
import type { DebateConfig } from '../../types/debate';

const initialState: GameConfigState = {
  topic: {
    title: '',
    description: ''
  },
  rules: {
    totalRounds: 4,
    debateFormat: 'structured'
  },
  debate: {
    topic: {
      title: '',
      description: '',
      type: 'binary'
    },
    rules: {
      debateFormat: 'structured',
      description: '',
      basicRules: {
        speechLengthLimit: {
          min: 100,
          max: 1000,
        },
        allowEmptySpeech: false,
        allowRepeatSpeech: false,
      },
      advancedRules: {
        allowQuoting: true,
        requireResponse: true,
        allowStanceChange: false,
        requireEvidence: true,
      },
    },
    judging: {
      description: '',
      dimensions: [],
      totalScore: 100,
    },
  },
  players: [],
  ruleConfig: {
    format: 'structured',
    description: '',
    advancedRules: {
      maxLength: 1000,
      minLength: 100,
      allowQuoting: true,
      requireResponse: true,
      allowStanceChange: false,
      requireEvidence: true,
    }
  },
  isConfiguring: true
};

export const gameConfigSlice = createSlice({
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
          title: state.debate.topic.title,
          description: state.debate.topic.description
        };
      }
      if (action.payload.rules) {
        state.debate.rules = {
          ...state.debate.rules,
          ...action.payload.rules
        };
        // 同步更新顶层 rules
        state.rules = {
          totalRounds: 4, // 默认值
          debateFormat: state.debate.rules.debateFormat
        };
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
        debateFormat: action.payload.format,
        description: action.payload.description,
        basicRules: {
          ...state.debate.rules.basicRules,
          speechLengthLimit: {
            min: action.payload.advancedRules.minLength,
            max: action.payload.advancedRules.maxLength
          }
        },
        advancedRules: {
          ...action.payload.advancedRules
        }
      };
      // 同步更新顶层 rules
      state.rules = {
        totalRounds: 4, // 默认值
        debateFormat: action.payload.format
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