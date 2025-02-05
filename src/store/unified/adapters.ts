import type { UnifiedState, UnifiedDebateState } from './types';
import type { GameConfigState } from '../../types/config';
import type { CharacterState } from '../../modules/character/context/CharacterContext';
import type { CharacterConfig } from '../../modules/character/types';

export class StateAdapter {
  // 从现有状态转换到统一状态
  static toUnified(
    gameConfig: GameConfigState,
    characterState: CharacterState
  ): UnifiedState {
    console.log('========== StateAdapter.toUnified 开始 ==========');
    console.log('输入状态:', {
      gameConfig: {
        topic: gameConfig.topic,
        rules: gameConfig.rules,
        playersCount: gameConfig.players.length,
        hasDebateConfig: !!gameConfig.debate,
        hasRuleConfig: !!gameConfig.ruleConfig,
        players: gameConfig.players
      },
      characterState: {
        charactersCount: characterState.characters.length,
        hasTemplates: !!characterState.templates,
        activeMode: characterState.activeMode,
        characters: characterState.characters
      }
    });

    // 转换角色状态
    const characters = {
      byId: {
        // 首先添加所有现有的角色
        ...characterState.characters.reduce<Record<string, CharacterConfig>>((acc, char) => {
          console.log('添加现有角色:', char.id, char.name);
          acc[char.id] = char;
          return acc;
        }, {}),
        // 然后添加默认角色配置（如果玩家没有分配角色）
        ...gameConfig.players
          .filter(p => p.isAI && !characterState.characters.find(c => c.id === p.characterId))
          .reduce<Record<string, CharacterConfig>>((acc, player) => {
            // 使用玩家现有的 characterId 或生成新的
            const characterId = player.characterId || `default_char_${player.id}`;
            console.log('为玩家创建默认角色:', player.id, characterId);
            acc[characterId] = {
              id: characterId,
              name: player.name,
              description: '默认AI角色',
              avatar: '',
              persona: {
                personality: [],
                speakingStyle: '',
                background: '',
                values: [],
                argumentationStyle: []
              },
              callConfig: {
                type: 'direct'
              },
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            return acc;
          }, {})
      },
      allIds: [] as string[],
      activeCharacters: gameConfig.players
        .filter(p => p.isAI)
        .map(p => {
          const characterId = p.characterId || `default_char_${p.id}`;
          console.log('激活角色:', p.id, characterId);
          return characterId;
        }),
      meta: {
        lastModified: Date.now(),
        version: '1.0.0'
      }
    };

    // 设置 allIds
    characters.allIds = Object.keys(characters.byId);
    console.log('角色ID列表:', characters.allIds);

    // 转换辩论状态
    const debate: UnifiedDebateState = {
      topic: {
        title: gameConfig.topic.title || '',
        description: gameConfig.topic.description || '',
        type: gameConfig.debate.topic.type || 'binary'
      },
      players: {
        byId: gameConfig.players.reduce((acc, player) => {
          // 获取玩家的角色状态
          const status = 'waiting';
          
          console.log('设置玩家角色:', {
            playerId: player.id,
            characterId: player.characterId,
            role: player.role,
            status
          });
          
          return {
            ...acc,
            [player.id]: {
              ...player,
              status,
              role: player.role || 'unassigned',
              characterId: player.characterId
            }
          };
        }, {}),
        allIds: gameConfig.players.map(p => p.id)
      },
      currentState: {
        round: 1,
        status: 'preparing',
        lastModified: Date.now()
      },
      rules: {
        format: gameConfig.ruleConfig.format || 'structured',
        totalRounds: gameConfig.rules.totalRounds || 4,
        timeLimit: gameConfig.debate.rules.basicRules.speechLengthLimit.max || 1000,
        basicRules: {
          speechLengthLimit: {
            min: gameConfig.debate.rules.basicRules.speechLengthLimit.min || 100,
            max: gameConfig.debate.rules.basicRules.speechLengthLimit.max || 1000
          },
          allowEmptySpeech: gameConfig.debate.rules.basicRules.allowEmptySpeech,
          allowRepeatSpeech: gameConfig.debate.rules.basicRules.allowRepeatSpeech
        },
        advancedRules: {
          allowQuoting: gameConfig.debate.rules.advancedRules.allowQuoting,
          requireResponse: gameConfig.debate.rules.advancedRules.requireResponse,
          allowStanceChange: gameConfig.debate.rules.advancedRules.allowStanceChange,
          requireEvidence: gameConfig.debate.rules.advancedRules.requireEvidence
        }
      },
      // 添加裁判配置
      judge: {
        characterId: gameConfig.debate.judging.selectedJudge?.id || '',
        name: gameConfig.debate.judging.selectedJudge?.name,
        avatar: gameConfig.debate.judging.selectedJudge?.avatar
      },
      judging: {
        description: gameConfig.debate.judging.description || '',
        dimensions: gameConfig.debate.judging.dimensions || [],
        totalScore: gameConfig.debate.judging.totalScore || 100
      }
    };

    // 转换配置状态
    const config = {
      activeMode: characterState.activeMode,
      settings: {
        dify: characterState.difyConfig,
        direct: characterState.directConfig
      }
    };

    const unifiedState: UnifiedState = {
      characters,
      debate,
      config
    };

    console.log('转换后的统一状态:', {
      charactersCount: Object.keys(unifiedState.characters.byId).length,
      activeCharactersCount: unifiedState.characters.activeCharacters.length,
      playersCount: Object.keys(unifiedState.debate.players.byId).length,
      debateFormat: unifiedState.debate.rules.format,
      topic: unifiedState.debate.topic,
      rules: unifiedState.debate.rules
    });

    console.log('========== StateAdapter.toUnified 完成 ==========');
    return unifiedState;
  }

  // 从统一状态转换回原始状态
  static fromUnified(state: UnifiedState): {
    gameConfig: Partial<GameConfigState>;
    characterState: Partial<CharacterState>;
  } {
    console.log('========== StateAdapter.fromUnified 开始 ==========');

    // 转换回游戏配置
    const gameConfig: Partial<GameConfigState> = {
      topic: {
        title: state.debate.topic.title,
        description: state.debate.topic.description
      },
      rules: {
        totalRounds: state.debate.rules.totalRounds,
        debateFormat: state.debate.rules.format
      },
      players: Object.values(state.debate.players.byId),
      isConfiguring: state.debate.currentState.status === 'preparing'
    };

    // 转换回角色状态
    const characterState: Partial<CharacterState> = {
      characters: Object.values(state.characters.byId),
      activeMode: state.config.activeMode,
      difyConfig: state.config.settings.dify,
      directConfig: state.config.settings.direct
    };

    console.log('转换回的原始状态:', {
      gameConfig: {
        playersCount: gameConfig.players?.length,
        hasRules: !!gameConfig.rules
      },
      characterState: {
        charactersCount: characterState.characters?.length,
        activeMode: characterState.activeMode
      }
    });

    console.log('========== StateAdapter.fromUnified 完成 ==========');
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
        allIds: [],
        activeCharacters: [],
        meta: {
          lastModified: Date.now(),
          version: '1.0.0'
        }
      },
      debate: {
        topic: {
          title: '',
          description: '',
          type: 'binary'
        },
        players: {
          byId: {},
          allIds: []
        },
        currentState: {
          round: 1,
          status: 'preparing',
          lastModified: Date.now()
        },
        rules: {
          format: 'structured',
          totalRounds: 4,
          timeLimit: 1000,
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
            requireEvidence: true
          }
        },
        judge: {
          characterId: '',
          name: '',
          avatar: ''
        },
        judging: {
          description: '',
          dimensions: [],
          totalScore: 100
        }
      },
      config: {
        activeMode: 'direct',
        settings: {
          dify: {
            serverUrl: '',
            apiKey: '',
            workflowId: '',
            parameters: {}
          },
          direct: {
            provider: '',
            apiKey: '',
            model: '',
            parameters: {}
          }
        }
      }
    };
  }
} 