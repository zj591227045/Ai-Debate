import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from '@emotion/styled';
import { useNavigate, useLocation } from 'react-router-dom';
import { keyframes } from '@emotion/react';
import { RoleAssignmentPanel } from '../components/debate/RoleAssignmentPanel';
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
import { ThemeProvider } from '@emotion/react';
import theme from '../styles/theme';
import { TopicConfigPanel, RuleConfigPanel, ScoringConfigPanel } from '../components/debate/ConfigPanels';

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
  will-change: transform;

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
    opacity: 0.5;
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
  transition: transform 0.3s ease;
  font-size: 1rem;
  font-weight: 500;
  text-shadow: ${({ active, theme }) => 
    active ? theme.shadows.text : 'none'
  };

  &:hover {
    transform: translateY(-2px);
  }
`;

const ContentWrapper = styled.div`
  ${({ theme }) => theme.mixins.glassmorphism}
  position: relative;
  z-index: 1;
  padding: 2rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.background.container};
  transition: transform 0.3s ease;
  will-change: transform;
  
  // 优化滚动容器
  & > div {
    max-height: calc(100vh - 250px);
    overflow-y: auto;
    padding-right: 1rem;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: ${({ theme }) => theme.colors.background.secondary};
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: ${({ theme }) => theme.colors.border.primary};
      border-radius: 3px;
    }
  }
`;

// 添加配置面板容器
const ConfigPanelsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin-bottom: 2rem;

  // 在大屏幕上横向排列
  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}) {
    flex-direction: row;
    justify-content: space-between;
    
    & > * {
      flex: 1;
      min-width: calc(33% - 1.5rem);
      max-width: calc(33% - 1.5rem);
    }
  }

  // 在平板上两列排列
  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) and (max-width: ${({ theme }) => theme.breakpoints.desktop}) {
    & > * {
      flex: 1;
      min-width: calc(50% - 1rem);
      max-width: calc(50% - 1rem);
    }
  }

  // 在移动端上单列排列
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    flex-direction: column;
    & > * {
      width: 100%;
    }
  }
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
  { id: '1', name: '选手1', role: 'unassigned' as DebateRole, isAI: true },
  { id: '2', name: '选手2', role: 'unassigned' as DebateRole, isAI: true },
  { id: '3', name: '选手3', role: 'unassigned' as DebateRole, isAI: true },
  { id: '4', name: '选手4', role: 'unassigned' as DebateRole, isAI: true }
];

const defaultConfig = {
  affirmativeCount: 2,
  negativeCount: 2,
  judgeCount: 0,
  timekeeperCount: 0,
  minPlayers: 2,
  maxPlayers: 6,
  autoAssign: false,
  format: 'free' as 'structured' | 'free',
  defaultRole: 'free' as DebateRole
};

const defaultDebateConfig: DebateConfig = {
  topic: {
    title: '',
    description: '',
    rounds: 3, // 设置默认轮数
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
    type: 'ai',
  }
};

interface PlayerCardProps {
  player: Player;
  onTakeoverPlayer: (id: string, name: string, isTakeover: boolean) => void;
  onRemovePlayer: (id: string) => void;
  onSelectCharacter: (id: string, characterId: string) => void;
}

const StyledPlayerCard = styled.div`
  ${({ theme }) => theme.mixins.glassmorphism}
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.background.container};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  will-change: transform;

  &:hover {
    transform: translateY(-2px);
  }
`;

const PlayerCard = React.memo<PlayerCardProps>(({ player, onTakeoverPlayer, onRemovePlayer, onSelectCharacter }) => {
  const handleTakeover = useCallback(() => {
    onTakeoverPlayer(player.id, player.name, !player.isAI);
  }, [player.id, player.name, player.isAI, onTakeoverPlayer]);

  const handleRemove = useCallback(() => {
    onRemovePlayer(player.id);
  }, [player.id, onRemovePlayer]);

  const handleCharacterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const characterId = e.target.value;
    onSelectCharacter(player.id, characterId);
  }, [player.id, onSelectCharacter]);

  const handleRemoveCharacter = useCallback(() => {
    onSelectCharacter(player.id, '');
  }, [player.id, onSelectCharacter]);

  return (
    <StyledPlayerCard>
      <PlayerHeader>
        <PlayerAvatar>
          {player.name[0]}
          {player.isAI && <AIBadge>AI</AIBadge>}
        </PlayerAvatar>
        <PlayerInfo>
          <PlayerName>{player.name}</PlayerName>
          <PlayerRole>{player.role}</PlayerRole>
        </PlayerInfo>
      </PlayerHeader>

      {player.isAI && (
        <div>
          <CharacterSelect 
            value={player.characterId || ''} 
            onChange={handleCharacterChange}
          >
            <option value="">选择AI角色</option>
            {/* 这里添加你的AI角色选项 */}
          </CharacterSelect>
          {player.characterId && (
            <ActionButton 
              variant="secondary" 
              onClick={handleRemoveCharacter}
              style={{ marginTop: '0.5rem' }}
            >
              移除AI角色
            </ActionButton>
          )}
        </div>
      )}

      <PlayerActions>
        <ActionButton onClick={handleTakeover}>
          {player.isAI ? '接管' : '设为AI'}
        </ActionButton>
        <ActionButton 
          variant="danger" 
          onClick={handleRemove}
        >
          移除
        </ActionButton>
      </PlayerActions>
    </StyledPlayerCard>
  );
});

const PlayerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
`;

const PlayerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PlayerAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.background.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  ${({ theme }) => theme.mixins.textGlow}
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text.primary};
  position: relative;
`;

const AIBadge = styled.div`
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  ${({ theme }) => theme.mixins.textGlow}
`;

const PlayerInfo = styled.div`
  flex: 1;
`;

const PlayerName = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  ${({ theme }) => theme.mixins.textGlow}
`;

const PlayerRole = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: 0.25rem;
`;

const PlayerActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.5rem 1rem;
  border: 1px solid ${({ theme, variant }) => 
    variant === 'primary' 
      ? theme.colors.primary 
      : variant === 'danger'
      ? theme.colors.error
      : theme.colors.border.primary};
  background: ${({ theme, variant }) => 
    variant === 'primary'
      ? `linear-gradient(45deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`
      : variant === 'danger'
      ? `linear-gradient(45deg, ${theme.colors.error}, ${theme.colors.error})`
      : 'transparent'};
  color: ${({ theme }) => theme.colors.text.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.sm};
    background: ${({ theme, variant }) => 
      variant === 'primary'
        ? theme.colors.primary
        : variant === 'danger'
        ? theme.colors.error
        : theme.colors.background.hover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const AddPlayerButton = styled(ActionButton)`
  width: 100%;
  padding: 1rem;
  margin-top: 1rem;
  border-style: dashed;
  background: transparent;

  &:hover {
    background: ${({ theme }) => theme.colors.background.hover};
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const CharacterSelect = styled.select`
  width: 100%;
  padding: 0.5rem;
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: 0.5rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }

  option {
    background: ${({ theme }) => theme.colors.background.primary};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const PlayerConfigContainer = styled.div`
  ${({ theme }) => theme.mixins.glassmorphism}
  margin-top: 2rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background.container};
  transition: all ${({ theme }) => theme.transitions.normal};
  
  .css-1lgt6oa-Container {
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .player-grid {
    ${PlayerGrid} {
      padding: 1.5rem;
    }
  }

  .player-card {
    > div {
      height: 100%;
    }
  }
`;

const GameConfigContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'roles' | 'characters' | 'models'>('roles');
  const { state: characterState } = useCharacter();
  const { state: gameConfig, setState: setGameConfig } = useStore('gameConfig');
  const [ruleConfig, setRuleConfig] = useState<RuleConfig>(() => {
    if (location.state?.lastConfig?.ruleConfig) {
      return {
        ...defaultRuleConfig,
        ...location.state.lastConfig.ruleConfig,
        description: location.state.lastConfig.ruleConfig.description || ''
      };
    }
    if (location.state?.lastConfig?.lastConfig?.debate?.rules) {
      return {
        ...defaultRuleConfig,
        ...location.state.lastConfig.debate.rules,
        description: location.state.lastConfig.debate.rules.description || ''
      };
    }
    return defaultRuleConfig;
  });
  const [debateConfig, setDebateConfig] = useState<DebateConfig>(() => {
    // 如果有上一次的配置，使用它
    if (location.state?.lastConfig?.debate) {
      const lastConfig = location.state.lastConfig.debate;
      return {
        ...defaultDebateConfig,
        ...lastConfig,
        topic: {
          title: lastConfig.topic?.title || '',
          description: lastConfig.topic?.description || '',
          rounds: lastConfig.topic?.rounds || 3
        },
        rules: {
          debateFormat: lastConfig.rules?.debateFormat || 'structured',
          description: lastConfig.rules?.description || '',
          advancedRules: {
            ...defaultDebateConfig.rules.advancedRules,
            ...lastConfig.rules?.advancedRules
          }
        },
        judging: {
          description: lastConfig.judging?.description || '',
          dimensions: lastConfig.judging?.dimensions || [],
          totalScore: lastConfig.judging?.totalScore || 100,
          type: lastConfig.judging?.type || 'ai',
          selectedJudge: lastConfig.judging?.selectedJudge || undefined
        }
      };
    }
    // 否则使用默认配置
    return defaultDebateConfig;
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

  // 使用 useMemo 缓存计算结果
  const memoizedDebateConfig = useMemo(() => ({
    ...debateConfig,
    topic: {
      ...debateConfig.topic,
      rounds: debateConfig.topic.rounds || 3
    }
  }), [debateConfig]);

  // 更新规则配置
  const handleRuleConfigChange = (newRuleConfig: RuleConfig) => {
    setRuleConfig(newRuleConfig);
    
    const currentDebate = gameConfig.debate || defaultDebateConfig;
    
    // 根据辩论格式更新玩家角色
    const updatedPlayers = players.map(player => ({
      ...player,
      role: newRuleConfig.debateFormat === 'structured' ? ('unassigned' as DebateRole) : ('free' as DebateRole)
    }));
    
    // 更新全局状态
    const updatedConfig: Partial<GameConfigState> = {
      ...gameConfig,
      players: updatedPlayers,
      debate: {
        ...currentDebate,
        topic: {
          ...currentDebate.topic
        },
        rules: {
          debateFormat: newRuleConfig.debateFormat,
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
    console.log('[handleDebateConfigChange] 收到的配置更新:', config);
    console.log('[handleDebateConfigChange] 当前配置:', debateConfig);
    
    const newConfig: DebateConfig = {
      ...debateConfig,
      ...config,
      topic: {
        ...debateConfig.topic,
        ...config.topic
      },
      rules: {
        ...debateConfig.rules,
        ...config.rules,
        description: config.rules?.description || debateConfig.rules.description,
        advancedRules: {
          ...debateConfig.rules.advancedRules,
          ...config.rules?.advancedRules
        }
      }
    };
    
    console.log('[handleDebateConfigChange] 更新后的配置:', newConfig);
    setDebateConfig(newConfig);
    setGameConfig({
      ...gameConfig,
      debate: newConfig
    });
  };

  // 修改状态更新函数
  const handleTakeoverPlayer = useCallback((playerId: string, playerName: string, isTakeover: boolean) => {
    const updatedPlayer = {
      id: playerId,
      name: playerName,
      isAI: !isTakeover,
      characterId: !isTakeover ? undefined : undefined,
    };
    
    updatePlayer(playerId, updatedPlayer);
    const updatedPlayers = players.map(p => 
      p.id === playerId ? { ...p, ...updatedPlayer } : p
    );
    
    setGameConfig({
      ...gameConfig,
      players: updatedPlayers
    } as GameConfigState);
  }, [players, updatePlayer, setGameConfig, gameConfig]);

  const handleAddAIPlayer = useCallback(() => {
    const playerNumber = players.length + 1;
    const newPlayer = {
      id: String(playerNumber),
      name: `选手${playerNumber}`,
      role: 'unassigned' as DebateRole,
      isAI: true
    };
    
    addPlayer(newPlayer.name, true);
    setGameConfig({
      ...gameConfig,
      players: [...players, newPlayer]
    } as GameConfigState);
  }, [players, addPlayer, setGameConfig, gameConfig]);

  // 修改 handleStartGame 函数
  const handleStartGame = () => {
    // 构建完整的配置对象，使用用户设置的轮次数
    const fullConfig: GameConfigState = {
      debate: {
        ...debateConfig,
        topic: {
          ...debateConfig.topic
        },
        rules: {
          ...debateConfig.rules,
          debateFormat: ruleConfig.debateFormat || 'structured',
          description: ruleConfig.description,
          advancedRules: {
            ...ruleConfig.advancedRules
          }
        },
        judging: {
          ...debateConfig.judging,
          description: debateConfig.judging?.description || '',
          dimensions: debateConfig.judging?.dimensions || [],
          totalScore: debateConfig.judging?.totalScore || 100,
          type: debateConfig.judging?.type || 'ai'
        }
      },
      players: players.map(player => ({
        ...player,
        characterId: player.characterId || undefined,
        role: player.role as DebateRole
      })),
      isConfiguring: false
    };
    
    if (validateConfig && !validateConfig(fullConfig)) {
      message.error('游戏配置验证失败，请检查配置是否完整');
      return;
    }

    setGameConfig(fullConfig);
    setDebateContextGameConfig(fullConfig);
    
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
    console.log('[handleLoadTemplate] 收到的模板配置:', config);
    console.log('[handleLoadTemplate] 当前配置:', {
      debateConfig,
      ruleConfig,
      gameConfig
    });
    
    const newConfig = {
      ...defaultDebateConfig,
      ...config,
      topic: {
        ...config.topic,
        rounds: config.topic?.rounds || 3
      },
      rules: {
        ...config.rules,
        description: config.rules?.description || '',
        advancedRules: {
          ...defaultDebateConfig.rules.advancedRules,
          ...config.rules?.advancedRules
        }
      },
      judging: {
        ...config.judging,
        description: config.judging?.description || '',
        dimensions: config.judging?.dimensions || [],
        totalScore: config.judging?.totalScore || 100,
        type: config.judging?.type || 'ai',
        selectedJudge: config.judging?.selectedJudge || undefined
      }
    };
    
    console.log('[handleLoadTemplate] 处理后的新配置:', newConfig);
    console.log('[handleLoadTemplate] 新配置中的规则说明:', newConfig.rules.description);
    
    // 从 localStorage 读取选手信息
    const gameConfigFromStorage = JSON.parse(localStorage.getItem('state_gameConfig') || '{}');
    console.log('[handleLoadTemplate] 从 localStorage 读取的游戏配置:', gameConfigFromStorage);
    
    const loadedPlayers = (gameConfigFromStorage.players || []) as Player[];
    console.log('[handleLoadTemplate] 加载的选手信息:', loadedPlayers);

    // 1. 遍历模板中的选手，更新或添加选手
    loadedPlayers.forEach((templatePlayer: Player) => {
      // 在当前选手列表中查找对应ID的选手
      const existingPlayer = players.find(p => p.id === templatePlayer.id);
      
      if (existingPlayer) {
        // 如果找到了，更新选手信息
        console.log('更新现有选手:', existingPlayer.id);
        updatePlayer(existingPlayer.id, {
          name: templatePlayer.name,
          role: templatePlayer.role,
          characterId: templatePlayer.characterId,
          isAI: templatePlayer.isAI
        });
      } else {
        // 如果没找到，添加新选手
        console.log('添加新选手:', templatePlayer.id);
        addPlayer(templatePlayer.name, templatePlayer.isAI);
        updatePlayer(templatePlayer.id, {
          role: templatePlayer.role,
          characterId: templatePlayer.characterId,
          isAI: templatePlayer.isAI
        });
      }
    });

    // 2. 移除多余的空选手
    const currentPlayers = [...players];
    for (const player of currentPlayers) {
      const templatePlayer = loadedPlayers.find(p => p.id === player.id);
      if (!templatePlayer && currentPlayers.length > loadedPlayers.length) {
        console.log('移除多余选手:', player.id);
        removePlayer(player.id);
      }
    }
    
    setDebateConfig(newConfig);
    setRuleConfig({
      ...defaultRuleConfig,
      debateFormat: config.rules?.debateFormat || 'structured',
      description: config.rules?.description || '',
      advancedRules: {
        ...defaultRuleConfig.advancedRules,
        ...config.rules?.advancedRules
      }
    });
    
    // 更新全局状态，包括选手信息
    const updatedGameConfig: GameConfigState = {
      ...gameConfig,
      debate: newConfig,
      players: loadedPlayers
    };
    
    console.log('最终更新的游戏配置:', updatedGameConfig);
    setGameConfig(updatedGameConfig);
    
    message.success('模板加载成功');
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
        debateFormat: ruleConfig.debateFormat,
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

  const handleRemovePlayer = useCallback((playerId: string) => {
    // 获取当前选手列表中除了要移除的选手之外的选手数量
    const remainingPlayers = players.filter(p => p.id !== playerId);
    
    // 如果剩余选手数量大于等于最小要求，则允许移除
    if (remainingPlayers.length >= 2) {
      removePlayer(playerId);
      setGameConfig({
        ...gameConfig,
        players: remainingPlayers
      } as GameConfigState);
    } else {
      message.warning('至少需要保留2名选手');
    }
  }, [players, removePlayer, setGameConfig, gameConfig]);

  const renderContent = () => {
    switch (activeTab) {
      case 'roles':
        return (
          <>
            <ConfigPanelsContainer>
              <TopicConfigPanel 
                debateConfig={debateConfig}
                onDebateConfigChange={handleDebateConfigChange}
              />
              <RuleConfigPanel
                ruleConfig={ruleConfig}
                onRuleConfigChange={handleRuleConfigChange}
              />
              <ScoringConfigPanel
                debateConfig={debateConfig}
                onJudgeConfigChange={handleJudgeConfigChange}
              />
            </ConfigPanelsContainer>
            <PlayerConfigContainer>
              <RoleAssignmentPanel
                players={players}
                config={config}
                debateFormat={ruleConfig.debateFormat}
                onAssignRole={assignRole}
                onAutoAssign={autoAssignRoles}
                onReset={resetRoles}
                onTakeoverPlayer={handleTakeoverPlayer}
                onRemovePlayer={handleRemovePlayer}
                onAddAIPlayer={players.length < config.maxPlayers ? handleAddAIPlayer : undefined}
                onStartDebate={handleStartGame}
                onSelectCharacter={handleSelectCharacter}
              />
            </PlayerConfigContainer>
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

  // 使用 useMemo 优化渲染内容
  const content = useMemo(() => renderContent(), [
    activeTab,
    players,
    config,
    ruleConfig,
    debateConfig,
    handleTakeoverPlayer,
    handleAddAIPlayer,
    handleStartGame,
    handleSelectCharacter,
    handleRemovePlayer
  ]);

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
          {content}
        </ContentWrapper>
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