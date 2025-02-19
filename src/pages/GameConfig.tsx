import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useNavigate, useLocation } from 'react-router-dom';
import { keyframes } from '@emotion/react';
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
import { ThemeProvider } from '@emotion/react';
import theme from '../styles/theme';

const logger = StateLogger.getInstance();

const glowAnimation = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(167,187,255,0.3), 0 0 10px rgba(167,187,255,0.2), 0 0 15px rgba(167,187,255,0.1);
  }
  50% {
    box-shadow: 0 0 10px rgba(167,187,255,0.4), 0 0 20px rgba(167,187,255,0.3), 0 0 30px rgba(167,187,255,0.2);
  }
  100% {
    box-shadow: 0 0 5px rgba(167,187,255,0.3), 0 0 10px rgba(167,187,255,0.2), 0 0 15px rgba(167,187,255,0.1);
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.backgroundGradient};
  padding: 2rem;
  position: relative;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.text.primary};

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(${({ theme }) => theme.colors.background.overlay} 1px, transparent 1px),
      linear-gradient(90deg, ${({ theme }) => theme.colors.background.overlay} 1px, transparent 1px);
    background-size: 50px 50px;
    pointer-events: none;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem 2rem;
  ${({ theme }) => theme.mixins.glassmorphism}
  border-radius: 15px;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 2.5rem;
  font-weight: 700;
  ${({ theme }) => theme.mixins.textGlow}
  margin: 0;
`;

const Tabs = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(167,187,255,0.2);
`;

const TabGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.8rem 1.5rem;
  background: ${({ active, theme }) => 
    active 
      ? theme.colors.backgroundGradient
      : theme.colors.background.container
  };
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: 500;
  text-shadow: ${({ active, theme }) => 
    active ? theme.shadows.text : 'none'
  };

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.primary};
  }

  animation: ${({ active, theme }) => active ? theme.animations.glow : 'none'} 2s ease-in-out infinite;
`;

const ContentWrapper = styled.div`
  ${({ theme }) => theme.mixins.glassmorphism}
  position: relative;
  z-index: 1;
  padding: 2rem;
  border-radius: 20px;
`;

const StyledButton = styled(Button)`
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #E8F0FF;
  background: ${props => 
    props.variant === 'primary' 
      ? 'linear-gradient(45deg, rgba(9,9,121,0.9), rgba(0,57,89,0.9))'
      : 'rgba(167,187,255,0.1)'
  };
  border: 1px solid rgba(167,187,255,0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(167,187,255,0.2);
  }

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      120deg,
      transparent,
      rgba(167,187,255,0.3),
      transparent
    );
    transition: 0.5s;
  }

  &:hover:before {
    left: 100%;
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
    <ThemeProvider theme={theme}>
      <Container>
        <Header>
          <Title>游戏配置</Title>
          <HeaderRight>
            <StyledButton variant="secondary" onClick={handleBack}>
              返回
            </StyledButton>
            <StyledButton variant="primary" onClick={handleStartGame}>
              开始游戏
            </StyledButton>
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

        <ContentWrapper>
          {renderContent()}
        </ContentWrapper>

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
    </ThemeProvider>
  );
};

export const GameConfig: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CharacterProvider>
        <ModelProvider>
          <GameConfigContent />
        </ModelProvider>
      </CharacterProvider>
    </ThemeProvider>
  );
};

export default GameConfig; 