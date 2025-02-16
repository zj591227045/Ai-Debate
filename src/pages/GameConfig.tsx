import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useNavigate, useLocation } from 'react-router-dom';
import RoleAssignmentPanel from '../components/debate/RoleAssignmentPanel';
import { useRoleAssignment } from '../hooks/useRoleAssignment';
import { Player, DebateRole } from '../types/player';
import { CharacterList, CharacterProvider, useCharacter } from '../modules/character';
import { ModelProvider } from '../modules/model/context/ModelContext';
import ModelList from '../modules/model/components/ModelList';
import TopicRuleConfig from '../components/debate/TopicRuleConfig';
import { defaultRuleConfig } from '../components/debate/RuleConfig';
import type { RuleConfig } from '../types/rules';
import { TemplateManager } from '../components/template/TemplateManager';
import type { DebateConfig } from '../types/debate';
import { message } from 'antd';
import { useStore } from '../modules/state';
import { useDebate } from '../contexts/DebateContext';
import type { GameConfigState } from '../types/config';
import { Button } from '../components/common/Button';
import { StateLogger } from '../modules/state/utils';
import { StateDebugger } from '../components/debug/StateDebugger';

const logger = StateLogger.getInstance();

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${props => props.theme.colors.background.default};
  padding: ${props => props.theme.spacing.lg};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.xl};
`;

const Tabs = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const TabGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
`;

const Tab = styled.button<{ active: boolean }>`
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => 
    props.active ? props.theme.colors.primary : props.theme.colors.background.secondary
  };
  color: ${props => 
    props.active ? props.theme.colors.white : props.theme.colors.text.primary
  };
  border: none;
  border-radius: ${props => props.theme.radius.md};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    opacity: 0.9;
  }
`;

// 默认的初始AI玩家
const defaultInitialPlayers: Player[] = [
  { id: '1', name: '选手1', role: 'free' as DebateRole, isAI: true },
  { id: '2', name: '选手2', role: 'free' as DebateRole, isAI: true },
  { id: '3', name: '选手3', role: 'free' as DebateRole, isAI: true },
  { id: '4', name: '选手4', role: 'free' as DebateRole, isAI: true },
];

const defaultConfig = {
  affirmativeCount: 2,
  negativeCount: 2,
  judgeCount: 0,
  timekeeperCount: 0,
  minPlayers: 4,
  maxPlayers: 6,
  autoAssign: false,
  format: 'free' as 'structured' | 'free',  // 默认使用自由辩论模式
  defaultRole: 'free' as DebateRole
};

const GameConfigContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'roles' | 'characters' | 'models'>('roles');
  const { state: characterState } = useCharacter();
  const { state: gameConfig, setState: setGameConfig } = useStore('gameConfig');
  const [ruleConfig, setRuleConfig] = useState<RuleConfig>(() => {
    if (location.state?.lastConfig?.ruleConfig) {
      return location.state.lastConfig.ruleConfig;
    }
    return defaultRuleConfig;
  });
  const [debateConfig, setDebateConfig] = useState<DebateConfig>(() => {
    if (location.state?.lastConfig) {
      return location.state.lastConfig;
    }
    return {
      topic: {
        title: '',
        description: '',
      },
      rules: {
        debateFormat: 'structured',
        description: '',
        advancedRules: {
          speechLengthLimit: {
            min: 100,
            max: 1000,
          },
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
    };
  });

  const { setGameConfig: setDebateContextGameConfig, validateConfig } = useDebate();
  
  // 使用上次的配置或默认配置
  const getInitialPlayers = () => {
    if (location.state?.lastConfig?.players) {
      return location.state.lastConfig.players;
    }
    return defaultInitialPlayers;
  };

  const getInitialConfig = () => {
    if (location.state?.lastConfig?.config) {
      return location.state.lastConfig.config;
    }
    return defaultConfig;
  };

  const {
    players,
    config,
    assignRole,
    updatePlayer,
    addPlayer,
    removePlayer,
    autoAssignRoles,
    resetRoles,
    getAssignedCount,
  } = useRoleAssignment(getInitialPlayers(), getInitialConfig());

  // 更新规则配置
  const handleRuleConfigChange = (newRuleConfig: RuleConfig) => {
    // 先更新本地的规则状态
    setRuleConfig(newRuleConfig);
    
    // 确保有默认值
    const currentDebate = gameConfig.debate || {
      topic: {
        title: '',
        description: '',
        rounds: 3
      },
      rules: {
        debateFormat: 'free',  // 默认使用自由辩论模式
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
    };
    
    // 根据辩论格式更新玩家角色
    const updatedPlayers = players.map(player => ({
      ...player,
      role: newRuleConfig.format === 'structured' ? 'unassigned' : 'free'
    }));
    
    // 更新全局状态
    const updatedConfig: Partial<GameConfigState> = {
      ...gameConfig,
      players: updatedPlayers,
      debate: {
        ...currentDebate,
        rules: {
          debateFormat: newRuleConfig.format,
          description: newRuleConfig.description,
          advancedRules: {
            ...newRuleConfig.advancedRules
          }
        }
      }
    };
    
    setGameConfig(updatedConfig);
  };

  // 更新辩论配置
  const handleDebateConfigChange = (config: Partial<DebateConfig>) => {
    const newConfig = {
      ...debateConfig,
      ...config,
      topic: {
        ...debateConfig.topic,
        ...config.topic,
        type: ruleConfig.format || 'structured'
      }
    };
    setDebateConfig(newConfig);
    setGameConfig({
      ...gameConfig,
      debate: newConfig
    });
  };

  // 修改 handleStartGame 函数
  const handleStartGame = () => {
    // 构建完整的配置对象
    const fullConfig: GameConfigState = {
      debate: {
        ...debateConfig,
        topic: {
          title: debateConfig.topic.title,
          description: debateConfig.topic.description,
          rounds: debateConfig.topic.rounds || 3
        },
        rules: {
          debateFormat: ruleConfig.format || 'structured',
          description: ruleConfig.description,
          advancedRules: {
            ...ruleConfig.advancedRules,
            speechLengthLimit: {
              min: ruleConfig.advancedRules.speechLengthLimit.min,
              max: ruleConfig.advancedRules.speechLengthLimit.max
            }
          }
        },
        judging: {
          description: debateConfig.judging?.description || '',
          dimensions: debateConfig.judging?.dimensions || [],
          totalScore: debateConfig.judging?.totalScore || 100
        }
      },
      players: players.map(player => ({
        ...player,
        characterId: player.characterId || undefined
      })),
      isConfiguring: false
    };
    
    if (validateConfig && !validateConfig(fullConfig)) {
      message.error('游戏配置验证失败，请检查配置是否完整');
      return;
    }

    // 更新状态
    setGameConfig({
      ...gameConfig,
      ...fullConfig
    });
    
    // 更新 DebateContext
    setDebateContextGameConfig(fullConfig);
    
    // 导航到辩论室
    navigate('/debate-room', { 
      state: { 
        config: fullConfig,
        lastConfig: {
          config,
          players,
          ruleConfig,
          debateConfig
        }
      } 
    });
  };

  // 修改 handleBack 函数
  const handleBack = () => {
    setGameConfig({
      ...gameConfig,
      debate: {
        topic: {
          title: '',
          description: '',
          rounds: 3,
        },
        rules: {
          debateFormat: 'structured',
          description: '',
          advancedRules: {
            speechLengthLimit: {
              min: 100,
              max: 1000,
            },
            allowQuoting: true,
            requireResponse: true,
            allowStanceChange: false,
            requireEvidence: true,
          }
        },
        judging: {
          description: '',
          dimensions: [],
          totalScore: 100,
        },
      },
    });
    navigate('/');
  };

  // 修改 handleLoadTemplate 函数
  const handleLoadTemplate = (config: DebateConfig) => {
    setDebateConfig(config);
    setRuleConfig({
      ...ruleConfig,
      format: config.rules.debateFormat,
      description: config.rules.description
    });
    setGameConfig({
      ...gameConfig,
      debate: config,
    });
    message.success('模板加载成功');
  };

  // 修改 handleTakeoverPlayer 函数
  const handleTakeoverPlayer = (playerId: string, playerName: string, isTakeover: boolean) => {
    const updatedPlayer = {
      id: playerId,
      name: playerName,
      isAI: !isTakeover,
      characterId: !isTakeover ? undefined : undefined,
    };
    
    updatePlayer(playerId, updatedPlayer);
    // 同步到 Redux store
    const updatedPlayers = players.map(p => 
      p.id === playerId ? { ...p, ...updatedPlayer } : p
    );
    setGameConfig({
      ...gameConfig,
      players: updatedPlayers
    });
  };

  // 修改 handleAddAIPlayer 函数
  const handleAddAIPlayer = () => {
    const playerNumber = players.length + 1;
    const newPlayer = {
      id: String(playerNumber),
      name: `选手${playerNumber}`,
      role: 'unassigned' as DebateRole,
      isAI: true
    };
    
    addPlayer(newPlayer.name, true);
    // 同步到 Redux store
    setGameConfig({
      ...gameConfig,
      players: [...players, newPlayer]
    });
  };

  const handleSaveTemplate = () => {
    // 构建完整的配置对象
    const templateConfig: DebateConfig = {
      topic: {
        title: debateConfig.topic.title,
        description: debateConfig.topic.description,
        rounds: debateConfig.topic.rounds,
      },
      rules: {
        debateFormat: ruleConfig.format,
        description: ruleConfig.description,
        advancedRules: {
          speechLengthLimit: {
            min: ruleConfig.advancedRules.speechLengthLimit.min,
            max: ruleConfig.advancedRules.speechLengthLimit.max,
          },
          allowQuoting: ruleConfig.advancedRules.allowQuoting,
          requireResponse: ruleConfig.advancedRules.requireResponse,
          allowStanceChange: ruleConfig.advancedRules.allowStanceChange,
          requireEvidence: ruleConfig.advancedRules.requireEvidence,
        },
      },
      judging: {
        description: debateConfig.judging?.description || '',
        dimensions: debateConfig.judging?.dimensions || [],
        totalScore: debateConfig.judging?.totalScore || 100,
      },
    };

    return templateConfig;
  };

  const handleSelectCharacter = (playerId: string, characterId: string) => {
    // 更新玩家的角色配置
    const updatedPlayers = players.map(p => 
      p.id === playerId ? { ...p, characterId } : p
    );
    
    // 立即更新本地状态
    updatePlayer(playerId, { characterId });
    
    // 更新全局游戏配置
    setGameConfig({
      ...gameConfig,
      players: updatedPlayers
    });
  };

  const handleJudgeConfigChange = (judging: Partial<DebateConfig['judging']>) => {
    const updatedJudging = {
      ...debateConfig.judging,
      ...judging
    };
    const newConfig = {
      ...debateConfig,
      judging: updatedJudging
    };
    setDebateConfig(newConfig);
    setGameConfig({
      ...gameConfig,
      debate: newConfig
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'roles':
        return (
          <>
            <TopicRuleConfig 
              ruleConfig={ruleConfig}
              onRuleConfigChange={handleRuleConfigChange}
              debateConfig={debateConfig}
              onDebateConfigChange={handleDebateConfigChange}
            />
            <RoleAssignmentPanel
              players={players}
              config={config}
              debateFormat={ruleConfig.format}
              onAssignRole={assignRole}
              onAutoAssign={autoAssignRoles}
              onReset={resetRoles}
              onTakeoverPlayer={handleTakeoverPlayer}
              onRemovePlayer={removePlayer}
              onAddAIPlayer={players.length < config.maxPlayers ? handleAddAIPlayer : undefined}
              onStartDebate={handleStartGame}
              onSelectCharacter={handleSelectCharacter}
            />
          </>
        );
      case 'characters':
        return <CharacterList />;
      case 'models':
        return <ModelList />;
      default:
        return null;
    }
  };

  useEffect(() => {
    logger.info('gameConfig', '组件已初始化', { initialState: gameConfig });
    return () => {
      logger.info('gameConfig', '组件已卸载');
    };
  }, []);

  return (
    <Container>
      <Header>
        <Title>游戏配置</Title>
        <HeaderRight>
          <Button variant="secondary" onClick={handleBack}>
            返回
          </Button>
          <Button variant="primary" onClick={handleStartGame}>
            开始游戏
          </Button>
        </HeaderRight>
      </Header>

      <Tabs>
        <TabGroup>
          <Tab
            active={activeTab === 'roles'}
            onClick={() => setActiveTab('roles')}
          >
            开局配置
          </Tab>
          <Tab
            active={activeTab === 'characters'}
            onClick={() => setActiveTab('characters')}
          >
            AI角色配置
          </Tab>
          <Tab
            active={activeTab === 'models'}
            onClick={() => setActiveTab('models')}
          >
            模型管理
          </Tab>
        </TabGroup>
        {activeTab === 'roles' && (
          <TemplateManager
            currentConfig={debateConfig}
            onLoadTemplate={handleLoadTemplate}
          />
        )}
      </Tabs>

      <div className="game-config-content">
        {renderContent()}
      </div>

      <StateDebugger
        state={{
          debate: {
            topic: gameConfig.debate?.topic || { title: '', description: '', rounds: 3 },
            rules: gameConfig.debate?.rules || {
              debateFormat: 'free',
              description: '',
              advancedRules: {
                speechLengthLimit: { min: 100, max: 1000 },
                allowQuoting: true,
                requireResponse: true,
                allowStanceChange: false,
                requireEvidence: true
              }
            },
            judging: gameConfig.debate?.judging || {},
            status: undefined,
            currentRound: 0,
            currentSpeaker: null,
            speeches: [],
            scores: [],
            format: gameConfig.debate?.rules?.debateFormat as 'structured' | 'free'
          },
          players: Object.values(gameConfig.players || {})
        }}
        onToggleDebugger={() => {}}
      />
    </Container>
  );
};

export const GameConfig: React.FC = () => {
  return (
    <CharacterProvider>
      <ModelProvider>
        <GameConfigContent />
      </ModelProvider>
    </CharacterProvider>
  );
};

export default GameConfig; 