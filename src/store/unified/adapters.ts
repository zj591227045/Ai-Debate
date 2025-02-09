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
      gameConfig: {
        playersCount: gameConfig.players.length,
        hasDebate: !!gameConfig.debate,
        hasRules: !!gameConfig.ruleConfig
      },
      characterState: {
        charactersCount: characterState.characters.length,
        templatesCount: characterState.templates.length,
        activeMode: characterState.activeMode
      }
    });

    try {
    // 处理裁判配置
    console.group('处理裁判配置');
    const processedJudge = {
        characterId: gameConfig.debate?.judging?.selectedJudge?.id || '',
        name: gameConfig.debate?.judging?.selectedJudge?.name || '',
      avatar: gameConfig.debate?.judging?.selectedJudge?.avatar || '',
      modelConfig: gameConfig.debate?.judging?.selectedJudge?.modelConfig
    };
    console.log('处理后的裁判信息:', processedJudge);
    console.groupEnd();

    // 处理评分维度
    console.group('处理评分维度');
    const processedDimensions = (gameConfig.debate?.judging?.dimensions || []).map(dim => {
      const processed = {
        id: dim.id || crypto.randomUUID(),
        name: dim.name || '',
          weight: Number(dim.weight) || 0,
        description: dim.description || '',
        criteria: dim.criteria || []
      };
      return processed;
    });
    
    // 计算总分
    const totalWeight = processedDimensions.reduce((sum, dim) => sum + (dim.weight || 0), 0);
    const processedJudging = {
        description: gameConfig.debate?.judging?.description || '',
      dimensions: processedDimensions,
        totalScore: totalWeight || 100,
      scoreRange: {
        min: 0,
        max: 100
      }
    };
    console.log('处理后的评分配置:', processedJudging);
    console.groupEnd();

    // 转换角色状态
      console.group('处理角色状态');
    const characters = {
        byId: {} as Record<string, CharacterConfig>,
      allIds: [] as string[],
        activeCharacters: [] as string[],
      meta: {
        lastModified: Date.now(),
        version: '1.0.0'
      }
    };

      // 记录输入状态
      console.log('输入状态:', {
        gameConfigPlayers: gameConfig.players,
        characterStateCharacters: characterState.characters,
        localStorageKeys: Object.keys(localStorage)
      });

      // 首先尝试从 localStorage 加载角色数据
      try {
        const savedCharacterState = localStorage.getItem('characterState');
        if (savedCharacterState) {
          console.log('从localStorage读取到characterState:', savedCharacterState);
          const parsedState = JSON.parse(savedCharacterState);
          if (Array.isArray(parsedState.characters) && parsedState.characters.length > 0) {
            console.log('从localStorage加载到角色数据:', {
              count: parsedState.characters.length,
              characters: parsedState.characters.map((c: CharacterConfig) => ({ id: c.id, name: c.name }))
            });
            parsedState.characters.forEach((char: CharacterConfig) => {
              if (char && char.id) {
                console.log('添加已保存角色:', { id: char.id, name: char.name });
                characters.byId[char.id] = {
                  ...char,
                  createdAt: char.createdAt || Date.now(),
                  updatedAt: Date.now()
                };
                characters.allIds.push(char.id);
              }
            });
          } else {
            console.warn('localStorage中的characterState格式不正确或为空');
          }
        } else {
          console.log('localStorage中没有找到characterState');
        }
      } catch (error) {
        console.error('从localStorage加载角色数据失败:', error);
      }

      // 如果localStorage中没有数据，再尝试从characterState加载
      if (Object.keys(characters.byId).length === 0) {
        console.log('尝试从characterState加载:', {
          hasCharacters: Array.isArray(characterState.characters),
          count: characterState.characters?.length || 0,
          characters: characterState.characters?.map((c: CharacterConfig) => ({ id: c.id, name: c.name }))
        });
        
        if (Array.isArray(characterState.characters)) {
          characterState.characters.forEach(char => {
            if (char && char.id) {
              console.log('添加现有角色:', { id: char.id, name: char.name });
              characters.byId[char.id] = {
                ...char,
                createdAt: char.createdAt || Date.now(),
                updatedAt: Date.now()
              };
              characters.allIds.push(char.id);
            }
          });
        } else {
          console.warn('characterState.characters不是数组');
        }
      }

      // 记录活跃角色
      const activeCharacterIds = (Object.values(gameConfig.players) || [])
        .filter(p => p.isAI && p.characterId)
        .map(p => p.characterId as string);
      
      console.log('活跃角色ID列表:', activeCharacterIds);

      // 如果仍然没有找到角色数据，尝试从unifiedState加载
      if (Object.keys(characters.byId).length === 0) {
        try {
          const savedUnifiedState = localStorage.getItem('unifiedState');
          if (savedUnifiedState) {
            console.log('从localStorage读取到unifiedState');
            const parsedState = JSON.parse(savedUnifiedState);
            if (parsedState.characters && Object.keys(parsedState.characters.byId).length > 0) {
              console.log('从unifiedState加载角色数据:', {
                count: Object.keys(parsedState.characters.byId).length,
                characters: Object.values(parsedState.characters.byId as Record<string, CharacterConfig>)
                  .map(c => ({ id: c.id, name: c.name }))
              });
              Object.assign(characters, parsedState.characters);
            } else {
              console.warn('unifiedState中没有有效的角色数据');
            }
          } else {
            console.log('localStorage中没有找到unifiedState');
          }
        } catch (error) {
          console.error('从unifiedState加载角色数据失败:', error);
        }
      }

      // 确保所有活跃角色都存在于 characters.byId 中
      activeCharacterIds.forEach(charId => {
        if (!characters.byId[charId]) {
          // 尝试从characterState中找到对应的角色
          const existingChar = characterState.characters.find(c => c.id === charId);
          if (existingChar) {
            console.log('找到并添加活跃角色:', { id: existingChar.id, name: existingChar.name });
            characters.byId[charId] = {
              ...existingChar,
              updatedAt: Date.now()
            };
            if (!characters.allIds.includes(charId)) {
              characters.allIds.push(charId);
            }
          } else {
            console.warn(`未找到角色 ${charId} 的信息，请检查角色配置`);
          }
        }
      });

      characters.activeCharacters = activeCharacterIds;

      // 验证角色状态完整性
      const missingCharacters = activeCharacterIds.filter(id => !characters.byId[id]);
      if (missingCharacters.length > 0) {
        console.error('缺少必要的角色信息:', {
          missingIds: missingCharacters,
          availableIds: Object.keys(characters.byId),
          characterState: characterState,
          localStorage: {
            hasCharacterState: !!localStorage.getItem('characterState'),
            hasUnifiedState: !!localStorage.getItem('unifiedState')
          }
        });
        throw new Error(`缺少必要的角色信息: ${missingCharacters.join(', ')}`);
      }

      console.log('处理后的角色状态:', {
        totalCharacters: Object.keys(characters.byId).length,
        activeCharacters: characters.activeCharacters.length,
        charactersList: Object.values(characters.byId).map(c => ({ id: c.id, name: c.name }))
      });
      console.groupEnd();

    // 转换辩论状态
      console.group('处理辩论状态');
      console.log('处理后的辩论状态:', {
        hasPlayers: Object.keys(gameConfig.players).length > 0,
        format: gameConfig.ruleConfig?.format || gameConfig.debate?.rules?.debateFormat || 'structured',
        status: 'preparing'
      });
      console.groupEnd();

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
        debate: {
      topic: {
        title: gameConfig.topic.title || '',
        description: gameConfig.topic.description || '',
        type: gameConfig.debate.topic.type || 'binary'
      },
      players: {
        byId: gameConfig.players.reduce((acc, player) => {
          const status = 'waiting';
              // 创建一个新的可扩展对象
              const newPlayer = {
              ...player,
                id: player.id,
                name: player.name,
                isAI: player.isAI,
              status,
              role: player.role || 'unassigned',
                characterId: player.characterId || undefined
              };
              return {
                ...acc,
                [player.id]: newPlayer
          };
        }, {}),
        allIds: gameConfig.players.map(p => p.id)
      },
      currentState: {
        round: 1,
            status: 'preparing' as const,
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
        },
      config
    };

    console.log('转换后的统一状态:', {
      charactersCount: Object.keys(unifiedState.characters.byId).length,
      activeCharactersCount: unifiedState.characters.activeCharacters.length,
      playersCount: Object.keys(unifiedState.debate.players.byId).length,
        debateFormat: unifiedState.debate.rules.format
    });

    console.groupEnd();
    return unifiedState;
    } catch (error) {
      console.error('状态转换失败:', error);
      throw error;
    }
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
          status: 'preparing' as const,
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