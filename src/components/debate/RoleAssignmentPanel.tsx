import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import type { Player, DebateRole } from '../../types/player';
import type { UnifiedRole } from '../../types/roles';
import type { RoleAssignmentConfig } from '../../hooks/useRoleAssignment';
import { Avatar, Space, Button as AntButton, Tooltip, Select, Modal, Input } from 'antd';
import { UserOutlined, RobotOutlined, SwapOutlined, PlusOutlined } from '@ant-design/icons';
import { useCharacter } from '../../modules/character/context/CharacterContext';
import { useModel } from '../../modules/model/context/ModelContext';
import { useStore } from '../../modules/state';
import { StateLogger } from '../../modules/state/utils';
import type { GameConfigState } from '../../types/config';
import { UnifiedPlayer, DEFAULT_PLAYER } from '../../types/adapters';
import type { ModelConfig } from '../../modules/model/types';
import type { SelectProps } from 'antd/es/select';

const logger = StateLogger.getInstance();

const Container = styled.div`
  ${({ theme }) => theme.mixins.glassmorphism}
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1.5rem;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.primary};
  ${({ theme }) => theme.mixins.glassmorphism}
`;

const Title = styled.h2`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin: 0;
  ${({ theme }) => theme.mixins.textGlow}
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
`;

const HeaderButton = styled(AntButton)`
  padding: 0.4rem 1rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  white-space: nowrap;
  height: 2rem;
  
  &:hover {
    transform: translateY(-1px);
  }
`;

const PlayerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
  width: 100%;
`;

const PlayerCard = styled.div`
  ${({ theme }) => theme.mixins.glassmorphism}
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  transition: all ${({ theme }) => theme.transitions.normal};
  background: ${({ theme }) => theme.colors.background.container};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  text-align: center;
  height: fit-content;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
    border-color: ${({ theme }) => theme.colors.border.secondary};
  }
`;

const PlayerHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const PlayerAvatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.background.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  ${({ theme }) => theme.mixins.textGlow}
  font-size: 3rem;
  color: ${({ theme }) => theme.colors.text.primary};
  position: relative;
  margin: 0 auto 1rem;
  border: 2px solid ${({ theme }) => theme.colors.border.secondary};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  transition: all ${({ theme }) => theme.transitions.normal};

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  &:hover {
    transform: scale(1.05);
    box-shadow: ${({ theme }) => theme.shadows.xl};
  }
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

const HumanBadge = styled(AIBadge)`
  background: ${({ theme }) => theme.colors.success};
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

const StyledSelect = styled(Select)`
  width: 100%;

  .ant-select-selector {
    background: rgba(255, 255, 255, 0.9) !important;
    border: 1px solid ${({ theme }) => theme.colors.border.primary} !important;
    border-radius: ${({ theme }) => theme.radius.md} !important;
    padding: 0.5rem !important;
    transition: all ${({ theme }) => theme.transitions.normal};
    height: auto !important;
    min-height: 40px;

    &:hover {
      border-color: ${({ theme }) => theme.colors.border.secondary} !important;
      box-shadow: ${({ theme }) => theme.shadows.sm} !important;
    }
  }

  .ant-select-selection-placeholder {
    color: rgba(0, 0, 0, 0.45) !important;
  }

  .ant-select-selection-item {
    color: rgba(0, 0, 0, 0.85) !important;
  }

  &.ant-select-focused .ant-select-selector {
    border-color: ${({ theme }) => theme.colors.primary} !important;
    box-shadow: ${({ theme }) => theme.shadows.lg} !important;
  }

  // 下拉菜单样式
  .ant-select-dropdown {
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
    border: 1px solid ${({ theme }) => theme.colors.border.primary};
    border-radius: ${({ theme }) => theme.radius.md};
    max-width: calc(100vw - 2rem);
    max-height: 400px;
    overflow-y: auto;
  }

  // 下拉选项样式
  .ant-select-item {
    color: rgba(0, 0, 0, 0.85) !important;
    border-radius: ${({ theme }) => theme.radius.sm};
    padding: 0.5rem 1rem;
    transition: all ${({ theme }) => theme.transitions.fast};
    background: transparent !important;

    &:hover {
      background: rgba(0, 0, 0, 0.1) !important;
    }

    &.ant-select-item-option-selected {
      background: ${({ theme }) => theme.colors.primary} !important;
      color: #ffffff !important;
    }
  }

  // 下拉选项容器
  .ant-select-item-option-content {
    color: rgba(0, 0, 0, 0.85) !important;
    white-space: normal;
    word-break: break-word;
  }

  // 选项激活状态
  .ant-select-item-option-active {
    background: rgba(0, 0, 0, 0.1) !important;
  }
`;

const CharacterOption = styled.div`
  padding: 0.5rem;
  max-width: 100%;
`;

const CharacterName = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: rgba(0, 0, 0, 0.85);
  margin-bottom: 0.25rem;
`;

const CharacterDescription = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.4;
  word-break: break-word;
`;

const CharacterInfo = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin: 0.5rem 0;
  line-height: 1.4;
`;

const ModelInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
  justify-content: center;
`;

const ModelTag = styled.span`
  background: ${({ theme }) => theme.colors.background.accent};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0.25rem 0.75rem;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  ${({ theme }) => theme.mixins.textGlow}
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.secondary};
`;

interface RoleAssignmentPanelProps {
  players: Player[];
  config: {
    maxPlayers: number;
  };
  debateFormat: string;
  onAssignRole: (playerId: string, role: DebateRole) => void;
  onAutoAssign: () => void;
  onReset: () => void;
  onTakeoverPlayer: (playerId: string, playerName: string, isTakeover: boolean) => void;
  onRemovePlayer: (playerId: string) => void;
  onAddAIPlayer?: () => void;
  onStartDebate: () => void;
  onSelectCharacter: (playerId: string, characterId: string) => void;
}

export const RoleAssignmentPanel: React.FC<RoleAssignmentPanelProps> = ({
  players,
  config,
  debateFormat,
  onAssignRole,
  onAutoAssign,
  onReset,
  onTakeoverPlayer,
  onRemovePlayer,
  onAddAIPlayer,
  onStartDebate,
  onSelectCharacter,
}) => {
  const { state: characterState } = useCharacter();
  const { models } = useModel();
  const [takeoverModalVisible, setTakeoverModalVisible] = useState(false);
  const [takeoverPlayerId, setTakeoverPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [characters, setCharacters] = useState<any[]>([]);
  const { state: gameConfig, setState: setGameConfig } = useStore('gameConfig');

  useEffect(() => {
    logger.info('roleAssignment', '组件已初始化', { initialState: gameConfig });
    return () => {
      logger.info('roleAssignment', '组件已卸载');
    };
  }, []);

  useEffect(() => {
    // 从 LocalStorage 加载角色配置，排除模板角色和人类角色
    try {
      const characterConfigs = JSON.parse(localStorage.getItem('character_configs') || '[]');
      const filteredCharacters = characterConfigs.filter((char: any) => 
        !char.isTemplate && !char.isHuman
      );
      setCharacters(filteredCharacters);
    } catch (error) {
      console.error('加载角色配置失败:', error);
      setCharacters([]);
    }
  }, []);

  // 获取已被选择的角色ID列表
  const selectedCharacterIds = players
    .filter(p => p.characterId)
    .map(p => p.characterId) as string[];

  // 检查是否已有人类玩家
  const hasHumanPlayer = players.some(p => !p.isAI);

  // 生成随机颜色的函数
  const getRandomColor = () => {
    const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#f56a00'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // 生成随机头像的函数
  const generateAvatarUrl = (name: string) => {
    const backgroundColor = getRandomColor();
    const size = 100;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${backgroundColor.replace('#', '')}&color=fff&size=${size}`;
  };

  const handleTakeoverClick = (playerId: string) => {
    if (hasHumanPlayer) {
      Modal.warning({
        title: '无法接管',
        content: '已有一名人类玩家，不能再接管其他角色',
      });
      return;
    }
    const player = players.find(p => p.id === playerId);
    if (player?.isAI) {
      setTakeoverPlayerId(playerId);
      setTakeoverModalVisible(true);
      setPlayerName('');
    } else {
      handleCancelTakeover(playerId);
    }
  };

  const handleTakeoverConfirm = () => {
    if (takeoverPlayerId && playerName.trim()) {
      const avatarUrl = generateAvatarUrl(playerName.trim());
      
      // 创建人类玩家的角色配置
      const humanCharacterId = `human_${takeoverPlayerId}`;
      const humanCharacterConfig = {
        id: humanCharacterId,
        name: playerName.trim(),
        description: '该选手由你来控制',
        avatar: avatarUrl,
        isTemplate: false,
        isHuman: true,
        personality: '由真实玩家控制',
        speakingStyle: '自然真实',
        background: '人类玩家',
        values: ['真实性', '参与性'],
        argumentationStyle: '个人风格'
      };

      // 保存人类玩家的角色配置到 localStorage
      try {
        const existingConfigs = JSON.parse(localStorage.getItem('character_configs') || '[]');
        const newConfigs = existingConfigs.filter((c: any) => c.id !== humanCharacterId);
        newConfigs.push(humanCharacterConfig);
        localStorage.setItem('character_configs', JSON.stringify(newConfigs));
        
        // 更新本地 characters 状态，这样UI会立即更新
        setCharacters(newConfigs);
      } catch (error) {
        console.error('保存人类玩家角色配置失败:', error);
      }
      
      // 更新玩家信息
      const updatedPlayers = players.map(p => 
        p.id === takeoverPlayerId ? {
          ...p,
          name: playerName.trim(),
          isAI: false,
          avatar: avatarUrl,
          characterId: humanCharacterId // 设置人类玩家的角色ID
        } : p
      );
      
      // 更新 gameConfig 中的 players
      const updatedGameConfig = {
        ...gameConfig,
        players: updatedPlayers,
        debate: gameConfig.debate ? {
          ...gameConfig.debate,
          players: updatedPlayers
        } : undefined
      };
      
      setGameConfig(updatedGameConfig);
      
      // 保存到 localStorage
      try {
        localStorage.setItem('state_gameConfig', JSON.stringify(updatedGameConfig));
      } catch (error) {
        console.error('保存游戏配置失败:', error);
      }

      // 调用接管回调
      onTakeoverPlayer(takeoverPlayerId, playerName.trim(), true);
      
      setTakeoverModalVisible(false);
      setTakeoverPlayerId(null);
      setPlayerName('');
    }
  };

  const handleCancelTakeover = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      // 直接执行移交AI的操作
      onTakeoverPlayer(playerId, `AI选手${player.name.match(/\d+/)?.[0] || ''}`, false);
      
      // 更新玩家信息
      const updatedPlayers = players.map(p => 
        p.id === playerId ? {
          ...p,
          name: `AI选手${p.name.match(/\d+/)?.[0] || ''}`,
          isAI: true,
          avatar: undefined,
          characterId: '' // 清除之前的角色配置
        } : p
      );
      
      // 更新gameConfig
      const updatedGameConfig = {
        ...gameConfig,
        players: updatedPlayers,
        debate: gameConfig.debate ? {
          ...gameConfig.debate,
          players: updatedPlayers
        } : undefined
      };
      
      setGameConfig(updatedGameConfig);
      
      // 保存到localStorage
      try {
        localStorage.setItem('state_gameConfig', JSON.stringify(updatedGameConfig));
      } catch (error) {
        console.error('保存游戏配置失败:', error);
      }
    }
  };

  const handleAssignRole = (playerId: string, role: UnifiedRole) => {
    onAssignRole(playerId, role as DebateRole);
    const updatedPlayers = players.map(p => 
      p.id === playerId ? { ...DEFAULT_PLAYER, ...p, role } : p
    );
    setGameConfig({
      ...gameConfig,
      players: updatedPlayers
    });
  };

  const handleRoleChange = (playerId: string, type: 'affirmative' | 'negative', currentRole: string) => {
    const playersByType = players.filter(p => p.role.startsWith(type));
    
    // 如果已经有3个同阵营选手，不允许再添加
    if (playersByType.length >= 3 && !currentRole.startsWith(type)) {
      return;
    }

    // 如果当前选手已经是该阵营，取消选择
    if (currentRole.startsWith(type)) {
      handleAssignRole(playerId, 'unassigned' as UnifiedRole);
      return;
    }

    // 根据已有选手数量分配号位
    const nextNumber = playersByType.length + 1;
    if (nextNumber <= 3) {
      handleAssignRole(playerId, `${type}${nextNumber}` as UnifiedRole);
    }
  };

  const handleSelectCharacter = (playerId: string, characterId: string | null) => {
    console.log('选择角色:', { playerId, characterId });
    onSelectCharacter(playerId, characterId || '');
    const updatedPlayers = players.map(p => 
      p.id === playerId ? { ...p, characterId: characterId || '' } : p
    );
    setGameConfig({
      ...gameConfig,
      players: updatedPlayers
    });
  };

  const handleAutoAssign = () => {
    onAutoAssign();
    const updatedPlayers = players.map(p => ({ 
      ...p, 
      role: 'unassigned' as UnifiedRole 
    }));
    setGameConfig({
      ...gameConfig,
      players: updatedPlayers
    });
  };

  const handleReset = () => {
    onReset();
    const resetPlayers = players.map(p => ({ 
      ...p, 
      role: 'unassigned' as UnifiedRole 
    }));
    setGameConfig({
      ...gameConfig,
      players: resetPlayers
    });
  };

  return (
    <Container>
      <Header>
        <Title>选手配置</Title>
        <ButtonGroup>
          {debateFormat === 'structured' && (
            <>
              <HeaderButton onClick={onAutoAssign}>自动分配</HeaderButton>
              <HeaderButton onClick={onReset}>重置</HeaderButton>
            </>
          )}
          {onAddAIPlayer && (
            <HeaderButton onClick={onAddAIPlayer}>
              添加AI选手
            </HeaderButton>
          )}
        </ButtonGroup>
      </Header>
      
      <PlayerGrid>
        {players.map((player) => {
          const selectedCharacter = player.characterId 
            ? characters.find(c => c.id === player.characterId)
            : undefined;
          
          const modelId = selectedCharacter?.callConfig?.type === 'direct' 
            ? selectedCharacter.callConfig.direct?.modelId 
            : undefined;
          const characterModel = modelId
            ? models.find((model: any) => model.id === modelId)
            : undefined;

          const availableCharacters = characters.filter(
            character => 
              // 排除已选择的角色、人类角色和模板角色
              (!selectedCharacterIds.includes(character.id) || character.id === player.characterId) &&
              !character.isHuman &&
              !character.isTemplate
          );

          return (
            <PlayerCard key={player.id}>
              <PlayerHeader>
                <PlayerAvatar>
                  {player.isAI ? (
                    selectedCharacter?.avatar ? (
                      <img src={selectedCharacter.avatar} alt={selectedCharacter.name} />
                    ) : (
                      <RobotOutlined />
                    )
                  ) : (
                    player.avatar ? (
                      <img src={player.avatar} alt={player.name} />
                    ) : (
                      <UserOutlined />
                    )
                  )}
                  {player.isAI ? (
                    <AIBadge>AI</AIBadge>
                  ) : (
                    <HumanBadge>人类</HumanBadge>
                  )}
                </PlayerAvatar>
                <PlayerInfo>
                  <PlayerName>{player.name}</PlayerName>
                  <PlayerRole>
                    {player.role === 'unassigned' ? '未分配' : player.role}
                  </PlayerRole>
                </PlayerInfo>
              </PlayerHeader>

              {player.isAI && (
                <StyledSelect
                  value={player.characterId || undefined}
                  onChange={(value) => {
                    // 处理清空和选择的情况
                    const characterId = value === undefined ? null : String(value || '');
                    handleSelectCharacter(player.id, characterId);
                  }}
                  placeholder="选择AI角色"
                  optionLabelProp="label"
                  allowClear
                >
                  {availableCharacters.map(character => (
                    <Select.Option 
                      key={character.id} 
                      value={character.id}
                      label={character.name}
                    >
                      <CharacterOption>
                        <CharacterName>{character.name}</CharacterName>
                        <CharacterDescription>
                          {character.description}
                        </CharacterDescription>
                      </CharacterOption>
                    </Select.Option>
                  ))}
                </StyledSelect>
              )}

              {selectedCharacter && (
                <CharacterInfo>
                  <div>{selectedCharacter.description}</div>
                  {characterModel && (
                    <ModelInfo>
                      <ModelTag>{characterModel.provider}</ModelTag>
                      <ModelTag>{characterModel.model}</ModelTag>
                    </ModelInfo>
                  )}
                </CharacterInfo>
              )}

              <PlayerActions>
                {player.isAI ? (
                  <ActionButton
                    variant="primary"
                    onClick={() => handleTakeoverClick(player.id)}
                  >
                    接管
                  </ActionButton>
                ) : (
                  <ActionButton
                    variant="primary"
                    onClick={() => handleCancelTakeover(player.id)}
                  >
                    移交AI
                  </ActionButton>
                )}
                <ActionButton
                  variant="danger"
                  onClick={() => onRemovePlayer(player.id)}
                >
                  移除
                </ActionButton>
              </PlayerActions>
            </PlayerCard>
          );
        })}
      </PlayerGrid>

      <Modal
        title="接管AI选手"
        open={takeoverModalVisible}
        onOk={handleTakeoverConfirm}
        onCancel={() => setTakeoverModalVisible(false)}
        okButtonProps={{ disabled: !playerName.trim() }}
        okText="确认"
        cancelText="取消"
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%', marginTop: '16px' }}>
          <div>请输入您的名字：</div>
          <Input
            placeholder="请输入玩家名称"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            onPressEnter={() => {
              if (playerName.trim()) {
                handleTakeoverConfirm();
              }
            }}
            autoFocus
          />
        </Space>
      </Modal>
    </Container>
  );
}; 