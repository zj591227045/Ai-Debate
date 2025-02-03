import React, { useState } from 'react';
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

const GameConfigContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'roles' | 'characters' | 'models'>('roles');
  const { state: characterState } = useCharacter();
  const [ruleConfig, setRuleConfig] = useState<RuleConfig>(() => {
    if (location.state?.lastConfig?.ruleConfig) {
      console.log('使用上次的规则配置:', location.state.lastConfig.ruleConfig);
      return location.state.lastConfig.ruleConfig;
    }
    console.log('使用默认规则配置');
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

  // 使用上次的配置或默认配置
  const getInitialPlayers = () => {
    if (location.state?.lastConfig?.players) {
      console.log('使用上次的玩家配置:', location.state.lastConfig.players);
      return location.state.lastConfig.players;
    }
    console.log('使用默认玩家配置');
    return defaultInitialPlayers;
  };

  const getInitialConfig = () => {
    if (location.state?.lastConfig?.config) {
      console.log('使用上次的游戏配置:', location.state.lastConfig.config);
      return location.state.lastConfig.config;
    }
    console.log('使用默认游戏配置');
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

  const handleBack = () => {
    navigate('/');
  };

  const handleStartDebate = () => {
    // 检查是否所有角色都已分配
    const affirmative = players.filter(p => p.role.startsWith('affirmative')).length;
    const negative = players.filter(p => p.role.startsWith('negative')).length;

    if (affirmative < 2 || negative < 2) {
      alert('请确保正方和反方各有两名选手！');
      return;
    }

    // 检查是否每个AI选手都有对应的角色配置
    const aiPlayersWithoutCharacter = players.filter(
      p => p.isAI && !characterState.characters.some(c => c.name === p.name)
    );

    if (aiPlayersWithoutCharacter.length > 0) {
      alert(`以下AI选手尚未配置角色：\n${aiPlayersWithoutCharacter.map(p => p.name).join('\n')}`);
      setActiveTab('characters');
      return;
    }

    // 添加调试信息
    console.log('GameConfig - 传递给辩论室的玩家配置:', {
      players,
      config,
      playerCount: players.length,
      roles: players.map(p => ({ name: p.name, role: p.role, isAI: p.isAI }))
    });

    // 将玩家配置传递给辩论室页面
    navigate('/debate-room', { 
      state: { 
        players,
        config,
        lastConfig: { players, config } // 保存最后一次的配置
      }
    });
  };

  const handleAddAIPlayer = () => {
    const playerNumber = players.length + 1;
    addPlayer(`AI选手${playerNumber}`, true);
  };

  const handleTakeoverPlayer = (playerId: string, playerName: string, isTakeover: boolean) => {
    updatePlayer(playerId, {
      name: playerName,
      isAI: !isTakeover,
      // 如果是取消接管，清除角色配置
      characterId: !isTakeover ? undefined : undefined,
    });
  };

  const handleLoadTemplate = (config: DebateConfig) => {
    // 更新辩论配置
    setDebateConfig(config);
    
    // 更新规则配置
    setRuleConfig({
      ...defaultRuleConfig,
      // 辩论形式
      format: config.rules.debateFormat === 'structured' ? 'structured' : 'free',
      // 规则说明
      description: config.rules.description,
      // 高级规则
      advancedRules: {
        maxLength: config.rules.basicRules.speechLengthLimit.max,
        minLength: config.rules.basicRules.speechLengthLimit.min,
        allowQuoting: config.rules.advancedRules.allowQuoting,
        requireResponse: config.rules.advancedRules.requireResponse,
        allowStanceChange: config.rules.advancedRules.allowStanceChange,
        requireEvidence: config.rules.advancedRules.requireEvidence,
      }
    });

    message.success('模板加载成功');
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
              onRuleConfigChange={setRuleConfig}
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