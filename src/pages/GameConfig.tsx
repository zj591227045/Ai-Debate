import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useNavigate, useLocation } from 'react-router-dom';
import { RoleAssignmentPanel } from '../components/debate/RoleAssignmentPanel';
import { useRoleAssignment } from '../hooks/useRoleAssignment';
import { Player, DebateRole } from '../types/player';
import { CharacterList, CharacterProvider, useCharacter } from '../modules/character';
import { ModelProvider } from '../modules/model/context/ModelContext';
import ModelList from '../modules/model/components/ModelList';
import { TopicRuleConfig } from '../components/debate/TopicRuleConfig';
import TemplateActions from '../components/debate/TemplateActions';
import { defaultRuleConfig } from '../components/debate/RuleConfig';
import type { RuleConfig } from '../types/rules';
import { TemplateManager } from '../components/template/TemplateManager';
import type { DebateConfig } from '../types/debate';
import { message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  setGameConfig, 
  clearGameConfig, 
  updateRuleConfig, 
  updatePlayers,
  updateDebateConfig 
} from '../store/slices/gameConfigSlice';
import { store } from '../store';

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

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background-color: ${props => 
    props.variant === 'primary' ? props.theme.colors.primary : props.theme.colors.background.secondary
  };
  color: ${props => 
    props.variant === 'primary' ? props.theme.colors.white : props.theme.colors.text.primary
  };
  border: none;
  border-radius: ${props => props.theme.radius.md};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  margin-left: ${props => props.theme.spacing.md};

  &:hover {
    opacity: 0.9;
  }
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
  { id: '1', name: 'AI选手1', role: 'unassigned' as DebateRole, isAI: true },
  { id: '2', name: 'AI选手2', role: 'unassigned' as DebateRole, isAI: true },
  { id: '3', name: 'AI选手3', role: 'unassigned' as DebateRole, isAI: true },
  { id: '4', name: 'AI选手4', role: 'unassigned' as DebateRole, isAI: true },
];

const defaultConfig = {
  affirmativeCount: 2,
  negativeCount: 2,
  judgeCount: 0,
  timekeeperCount: 0,
  minPlayers: 4,
  maxPlayers: 6,
  autoAssign: false,
};

// 添加状态监视器组件
const StateMonitor: React.FC = () => {
  const gameConfig = useSelector((state: RootState) => state.gameConfig);
  
  console.log('StateMonitor - Current gameConfig:', gameConfig);
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 20, 
      right: 20, 
      padding: 20,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      borderRadius: 8,
      maxWidth: 400,
      maxHeight: 300,
      overflow: 'auto'
    }}>
      <h3>状态监视器</h3>
      <pre style={{ fontSize: 12 }}>
        {JSON.stringify(gameConfig, null, 2)}
      </pre>
    </div>
  );
};

const GameConfigContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'roles' | 'characters' | 'models'>('roles');
  const { state: characterState } = useCharacter();
  const [ruleConfig, setRuleConfig] = useState<RuleConfig>(() => {
    if (location.state?.lastConfig?.ruleConfig) {
      // console.log('使用上次的规则配置:', location.state.lastConfig.ruleConfig);
      return location.state.lastConfig.ruleConfig;
    }
    //console.log('使用默认规则配置');
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
        type: 'binary',
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
        dimensions: [
          {
            name: '逻辑性',
            weight: 30,
            description: '论证的逻辑严密程度',
            criteria: ['论点清晰', '论证充分', '结构完整'],
          },
          {
            name: '创新性',
            weight: 20,
            description: '观点和论证的创新程度',
            criteria: ['视角新颖', '论证方式创新', '例证独特'],
          },
          {
            name: '表达性',
            weight: 20,
            description: '语言表达的准确性和流畅性',
            criteria: ['用词准确', '语言流畅', '表达清晰'],
          },
          {
            name: '互动性',
            weight: 30,
            description: '与对方观点的互动和回应程度',
            criteria: ['回应准确', '反驳有力', '互动充分'],
          },
        ],
        totalScore: 100,
      },
    };
  });

  const dispatch = useDispatch();
  const gameConfig = useSelector((state: RootState) => state.gameConfig);
  
  console.log('GameConfigContent - Current Redux State:', gameConfig);

  // 使用上次的配置或默认配置
  const getInitialPlayers = () => {
    if (location.state?.lastConfig?.players) {
      console.log('使用上次的玩家配置:', location.state.lastConfig.players);
      return location.state.lastConfig.players;
    }
  //  console.log('使用默认玩家配置');
    return defaultInitialPlayers;
  };

  const getInitialConfig = () => {
    if (location.state?.lastConfig?.config) {
      console.log('使用上次的游戏配置:', location.state.lastConfig.config);
      return location.state.lastConfig.config;
    }
   // console.log('使用默认游戏配置');
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

  // 更新规则配置时同时更新 Redux store
  const handleRuleConfigChange = (newRuleConfig: RuleConfig) => {
    console.log('GameConfig - handleRuleConfigChange:', newRuleConfig);
    setRuleConfig(newRuleConfig);
    dispatch(updateRuleConfig(newRuleConfig));
  };

  // 更新辩论配置时同时更新本地状态
  const handleDebateConfigChange = (config: Partial<DebateConfig>) => {
    console.log('GameConfig - handleDebateConfigChange - Before:', debateConfig);
    const newConfig = {
      ...debateConfig,
      ...config
    };
    console.log('GameConfig - handleDebateConfigChange - After:', newConfig);
    setDebateConfig(newConfig);
  };

  // 添加 Redux store 更新的监听
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      console.log('GameConfig - Redux State Updated:', state.gameConfig);
      if (state.gameConfig?.debate) {
        handleDebateConfigChange(state.gameConfig.debate);
      }
    });
    return () => unsubscribe();
  }, []);

  // 修改 handleStartDebate 函数
  const handleStartDebate = () => {
    // 直接保存当前配置到 Redux store
    dispatch(setGameConfig({
      debate: debateConfig,
      players,
      ruleConfig,
      isConfiguring: false
    }));

    // 导航到辩论室
    navigate('/debate-room');
  };

  // 修改 handleBack 函数
  const handleBack = () => {
    dispatch(clearGameConfig());
    navigate('/');
  };

  // 修改 handleLoadTemplate 函数
  const handleLoadTemplate = (config: DebateConfig) => {
    setDebateConfig(config);
    
    // 更新规则配置
    const newRuleConfig: RuleConfig = {
      format: config.rules.debateFormat === 'structured' ? 'structured' : 'free',
      description: config.rules.description,
      advancedRules: {
        maxLength: config.rules.basicRules.speechLengthLimit.max,
        minLength: config.rules.basicRules.speechLengthLimit.min,
        allowQuoting: config.rules.advancedRules.allowQuoting,
        requireResponse: config.rules.advancedRules.requireResponse,
        allowStanceChange: config.rules.advancedRules.allowStanceChange,
        requireEvidence: config.rules.advancedRules.requireEvidence,
      }
    };
    
    setRuleConfig(newRuleConfig);
    
    // 同时更新 Redux store
    dispatch(updateDebateConfig(config));
    dispatch(updateRuleConfig(newRuleConfig));

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
    dispatch(updatePlayers(updatedPlayers));
  };

  // 修改 handleAddAIPlayer 函数
  const handleAddAIPlayer = () => {
    const playerNumber = players.length + 1;
    const newPlayer = {
      id: String(playerNumber),
      name: `AI选手${playerNumber}`,
      role: 'unassigned' as DebateRole,
      isAI: true
    };
    
    addPlayer(newPlayer.name, true);
    // 同步到 Redux store
    dispatch(updatePlayers([...players, newPlayer]));
  };

  const handleSaveTemplate = () => {
    // 构建完整的配置对象
    const templateConfig: DebateConfig = {
      topic: {
        title: debateConfig.topic.title,
        description: debateConfig.topic.description,
        type: ruleConfig.format === 'structured' ? 'binary' : 'open',
      },
      rules: {
        debateFormat: ruleConfig.format,
        description: ruleConfig.description,
        basicRules: {
          speechLengthLimit: {
            min: ruleConfig.advancedRules.minLength,
            max: ruleConfig.advancedRules.maxLength,
          },
          allowEmptySpeech: false,
          allowRepeatSpeech: ruleConfig.advancedRules.allowQuoting,
        },
        advancedRules: {
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
    updatePlayer(playerId, {
      characterId,
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
              onStartDebate={handleStartDebate}
              onSelectCharacter={handleSelectCharacter}
            />
          </>
        );
      case 'characters':
        return <CharacterList />;
      case 'models':
        return (
          <ModelProvider>
            <ModelList />
          </ModelProvider>
        );
      default:
        return null;
    }
  };

  return (
    <Container>
      <Header>
        <Title>游戏配置</Title>
        <HeaderRight>
          <Button variant="secondary" onClick={handleBack}>
            返回
          </Button>
          <Button variant="primary" onClick={handleStartDebate}>
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
      <StateMonitor />
    </Container>
  );
};

export const GameConfig: React.FC = () => {
  return (
    <CharacterProvider>
      <GameConfigContent />
    </CharacterProvider>
  );
};

export default GameConfig; 