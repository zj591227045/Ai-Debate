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
    console.group('=== StateAdapter.toUnified ===');
    console.log('输入配置:', {
      gameConfig,
      characterState
    });

    // 处理裁判配置
    console.group('处理裁判配置');
    const processedJudge = {
      characterId: gameConfig.debate?.judging?.selectedJudge?.id || 'default_3',
      name: gameConfig.debate?.judging?.selectedJudge?.name || '罗辑',
      avatar: gameConfig.debate?.judging?.selectedJudge?.avatar || '',
      modelConfig: gameConfig.debate?.judging?.selectedJudge?.modelConfig
    };
    console.log('处理后的裁判信息:', processedJudge);
    console.groupEnd();

    // 处理评分维度
    console.group('处理评分维度');
    const processedDimensions = (gameConfig.debate?.judging?.dimensions || []).map(dim => {
      console.log('处理维度:', {
        id: dim.id,
        name: dim.name,
        weight: dim.weight,
        description: dim.description
      });
      
      const processed = {
        id: dim.id || crypto.randomUUID(),
        name: dim.name || '',
        weight: Number(dim.weight) || 0,  // 确保权重是数字
        description: dim.description || '',
        criteria: dim.criteria || []
      };
      
      console.log('处理后的维度:', processed);
      return processed;
    });
    
    // 计算总分
    const totalWeight = processedDimensions.reduce((sum, dim) => sum + (dim.weight || 0), 0);
    console.log('维度总权重:', totalWeight);
    
    // 如果总权重不等于100，按比例调整
    if (totalWeight !== 0 && totalWeight !== 100) {
      console.log('调整维度权重以达到100分');
      processedDimensions.forEach(dim => {
        dim.weight = Math.round((dim.weight / totalWeight) * 100);
      });
    }
    
    console.log('最终处理后的评分维度:', processedDimensions);
    console.groupEnd();

    // 处理评分配置
    console.group('处理评分配置');
    const processedJudging = {
      description: gameConfig.debate?.judging?.description || '正常评分',
      dimensions: processedDimensions,
      totalScore: 100,  // 固定总分为100
      scoreRange: {
        min: 0,
        max: 100
      }
    };
    console.log('处理后的评分配置:', processedJudging);
    console.groupEnd();

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
          const status = 'waiting';
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
      judge: processedJudge,
      judging: processedJudging
    };

    console.log('转换后的辩论状态:', {
      hasJudge: !!debate.judge,
      judgeConfig: {
        characterId: debate.judge.characterId,
        name: debate.judge.name,
        avatar: debate.judge.avatar
      },
      judgingConfig: {
        description: debate.judging.description,
        dimensionsCount: debate.judging.dimensions.length,
        totalScore: debate.judging.totalScore
      }
    });

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

    console.groupEnd();
    return unifiedState;
  }

  // 从统一状态转换回原始状态
  static fromUnified(state: UnifiedState): {
    gameConfig: Partial<GameConfigState>;
    characterState: Partial<CharacterState>;
  } {
    console.group('=== StateAdapter.fromUnified ===');
    console.log('输入状态:', state);

    // 处理裁判配置
    console.group('处理裁判配置');
    const processedJudging = {
      description: state.debate.judging.description || '正常评分',
      dimensions: state.debate.judging.dimensions.map(dim => ({
        id: dim.id,
        name: dim.name || '',
        weight: dim.weight || 1,
        description: dim.description || '',
        criteria: dim.criteria || []
      })),
      totalScore: state.debate.judging.totalScore || 100,
      selectedJudge: state.debate.judge ? {
        id: state.debate.judge.characterId,
        name: state.debate.judge.name || '未命名裁判',
        avatar: state.debate.judge.avatar || '',
        modelConfig: state.debate.judge.modelConfig
      } : undefined
    };
    console.log('处理后的裁判配置:', processedJudging);
    console.groupEnd();

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
      isConfiguring: state.debate.currentState.status === 'preparing',
      debate: {
        topic: state.debate.topic,
        rules: {
          debateFormat: state.debate.rules.format,
          description: '',
          basicRules: {
            speechLengthLimit: {
              min: state.debate.rules.basicRules?.speechLengthLimit?.min || 100,
              max: state.debate.rules.basicRules?.speechLengthLimit?.max || 1000
            },
            allowEmptySpeech: state.debate.rules.basicRules?.allowEmptySpeech ?? false,
            allowRepeatSpeech: state.debate.rules.basicRules?.allowRepeatSpeech ?? false
          },
          advancedRules: {
            allowQuoting: state.debate.rules.advancedRules?.allowQuoting ?? true,
            requireResponse: state.debate.rules.advancedRules?.requireResponse ?? true,
            allowStanceChange: state.debate.rules.advancedRules?.allowStanceChange ?? false,
            requireEvidence: state.debate.rules.advancedRules?.requireEvidence ?? true
          }
        },
        judging: processedJudging
      },
      ruleConfig: {
        format: state.debate.rules.format,
        description: '',
        advancedRules: {
          maxLength: state.debate.rules.basicRules?.speechLengthLimit?.max || 1000,
          minLength: state.debate.rules.basicRules?.speechLengthLimit?.min || 100,
          allowQuoting: state.debate.rules.advancedRules?.allowQuoting ?? true,
          requireResponse: state.debate.rules.advancedRules?.requireResponse ?? true,
          allowStanceChange: state.debate.rules.advancedRules?.allowStanceChange ?? false,
          requireEvidence: state.debate.rules.advancedRules?.requireEvidence ?? true
        }
      }
    };

    // 转换回角色状态
    const characterState: Partial<CharacterState> = {
      characters: Object.values(state.characters.byId),
      activeMode: state.config.activeMode,
      difyConfig: state.config.settings.dify,
      directConfig: state.config.settings.direct
    };

    console.log('最终游戏配置:', {
      hasDebateConfig: !!gameConfig.debate,
      hasJudgingConfig: !!gameConfig.debate?.judging,
      judgingConfig: gameConfig.debate?.judging ? {
        hasSelectedJudge: !!gameConfig.debate.judging.selectedJudge,
        description: gameConfig.debate.judging.description,
        dimensionsCount: gameConfig.debate.judging.dimensions.length,
        totalScore: gameConfig.debate.judging.totalScore
      } : null
    });

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

    console.groupEnd();

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
          avatar: '',
          modelConfig: undefined
        },
        judging: {
          description: '',
          dimensions: [],
          totalScore: 100,
          scoreRange: {
            min: 0,
            max: 100
          }
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