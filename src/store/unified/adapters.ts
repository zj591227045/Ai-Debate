import type { UnifiedState } from './types';
import type { GameConfigState } from '../../types/config';
import type { CharacterConfig } from '../../modules/character/types';
import type { CharacterStateStorage } from './types';

export class StateAdapter {
  // 从现有状态转换到统一状态
  static toUnified(gameConfig: GameConfigState, characterState: any): UnifiedState {
    console.group('StateAdapter.toUnified');
    try {
      const { characters, templates } = characterState;
      const byId = (characters || []).reduce((acc: Record<string, CharacterConfig>, char: CharacterConfig) => {
        acc[char.id] = char;
        return acc;
      }, {});

      const templateById = (templates || []).reduce((acc: Record<string, CharacterConfig>, template: CharacterConfig) => {
        acc[template.id] = template;
        return acc;
      }, {});

      const processedJudge = gameConfig.debate?.judging?.selectedJudge ? {
        characterId: gameConfig.debate.judging.selectedJudge.id,
        name: gameConfig.debate.judging.selectedJudge.name,
        avatar: gameConfig.debate.judging.selectedJudge.avatar,
        config: gameConfig.debate.judging.selectedJudge.modelConfig
      } : undefined;

      const activeCharacterIds = (gameConfig.players || [])
        .filter(p => p.isAI && p.characterId)
        .map(p => p.characterId as string);

      const playersById = (gameConfig.players || []).reduce((acc: Record<string, any>, player) => {
        const status = 'waiting';
        const newPlayer = {
          id: player.id,
          name: player.name,
          isAI: player.isAI,
          status,
          role: player.role || 'unassigned',
          characterId: player.characterId || ''
        };
        return {
          ...acc,
          [player.id]: newPlayer
        };
      }, {});

      return {
        characters: {
          byId,
          activeCharacters: activeCharacterIds,
          meta: {
            lastModified: Date.now(),
            version: '1.0.0'
          },
          templates: {
            byId: templateById
          }
        },
        debate: {
          players: {
            byId: playersById
          },
          currentState: {
            round: 0,
            status: 'preparing'
          },
          rules: gameConfig.rules,
          topic: gameConfig.topic,
          judge: processedJudge,
          judging: gameConfig.debate.judging
        },
        config: gameConfig
      };
    } catch (error) {
      console.error('转换状态失败:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }

  // 从统一状态转换回原始状态
  static fromUnified(state: UnifiedState): {
    gameConfig: Partial<GameConfigState>;
    characterState: Partial<CharacterStateStorage>;
  } {
    console.group('=== StateAdapter.fromUnified ===');
    console.log('输入状态:', state);

    // 转换回角色状态
    const characterState: Partial<CharacterStateStorage> = {
      characters: Object.values(state.characters.byId),
      templates: state.characters.templates ? Object.values(state.characters.templates.byId) : [],
      activeMode: 'direct',
      difyConfig: state.config.settings.dify || {},
      directConfig: state.config.settings.direct || {}
    };

    // 转换回游戏配置
    const gameConfig: Partial<GameConfigState> = {
      ...state.config,
      players: Object.values(state.debate.players.byId).map(player => ({
        id: player.id,
        name: player.name,
        isAI: player.isAI,
        role: player.role,
        characterId: player.characterId
      }))
    };

    return { gameConfig, characterState };
  }

  // 获取玩家的角色信息
  static getPlayerCharacter(state: UnifiedState, playerId: string) {
    const player = state.debate.players.byId[playerId];
    if (!player?.characterId) {
      console.log(`玩家 ${playerId} 没有关联的角色`);
      return null;
    }
    const character = state.characters.byId[player.characterId];
    if (!character) {
      console.log(`未找到角色 ${player.characterId}`);
      return null;
    }
    return character;
  }

  // 获取所有AI玩家的角色信息
  static getAIPlayersWithCharacters(state: UnifiedState) {
    return Object.values(state.debate.players.byId)
      .filter(player => player.isAI)
      .map(player => ({
        ...player,
        character: player.characterId ? state.characters.byId[player.characterId] : null
      }));
  }

  // 创建初始状态
  static createInitialState(): UnifiedState {
    return {
      characters: {
        byId: {},
        activeCharacters: [],
        meta: {
          lastModified: Date.now(),
          version: '1.0.0'
        }
      },
      debate: {
        players: {
          byId: {}
        },
        currentState: {
          round: 1,
          status: 'preparing' as const
        },
        topic: {
          title: '',
          description: '',
          type: 'binary' as const
        },
        rules: {
          format: 'structured' as const,
          timeLimit: 300,
          totalRounds: 4,
          debateFormat: 'structured' as const,
          description: '标准辩论规则',
          basicRules: {
            speechLengthLimit: {
              min: 100,
              max: 1000
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
        }
      },
      config: {
        settings: {
          roundCount: 3,
          timeLimit: 300,
          language: 'zh-CN'
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
      }
    };
  }
} 