import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import type { Player } from '../../types/player';
import type { UnifiedRole } from '../../types/roles';
import type { RoleAssignmentConfig } from '../../hooks/useRoleAssignment';
import { Avatar, Space, Button as AntButton, Tooltip, Select, Modal, Input } from 'antd';
import { UserOutlined, RobotOutlined, SwapOutlined } from '@ant-design/icons';
import { useCharacter } from '../../modules/character/context/CharacterContext';
import { useModel } from '../../modules/model/context/ModelContext';
import { useStore } from '../../modules/state';
import { StateLogger } from '../../modules/state/utils';
import type { GameConfigState } from '../../types/config';
import { UnifiedPlayer, DEFAULT_PLAYER } from '../../types/adapters';

const logger = StateLogger.getInstance();

const Container = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const PlayerList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 24px;
`;

const PlayerCard = styled.div<{ $isAffirmative?: boolean; $isNegative?: boolean; $isHuman?: boolean }>`
  background: white;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 12px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  ${props => props.$isAffirmative && `
    border-left: 4px solid #4157ff;
    background: linear-gradient(to right, rgba(65, 87, 255, 0.05), transparent);
  `}
  
  ${props => props.$isNegative && `
    border-left: 4px solid #ff4157;
    background: linear-gradient(to right, rgba(255, 65, 87, 0.05), transparent);
  `}
  
  ${props => props.$isHuman && `
    border-left: 4px solid #ff9041;
    background: linear-gradient(to right, rgba(255, 144, 65, 0.05), transparent);
  `}

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
  width: 100%;
`;

const StyledAvatar = styled(Avatar)`
  width: 120px;
  height: 120px;
  margin-bottom: 4px;
  
  .ant-avatar-string {
    font-size: 48px;
    line-height: 120px;
  }
  
  .anticon {
    font-size: 64px;
  }
`;

const AIBadge = styled.div`
  position: absolute;
  bottom: 0;
  right: calc(50% - 70px);
  background: #4157ff;
  color: white;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
`;

const CardHeader = styled.div`
  text-align: center;
  margin-bottom: 8px;
`;

const PlayerName = styled.h3`
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 500;
  text-align: center;
`;

const CharacterInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;

  .character-description {
    margin: 4px 0;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.45);
    text-align: center;
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
`;

const PlayerInfo = styled.div`
  flex: 1;
`;

const RoleSelector = styled.div`
  display: flex;
  gap: 8px;
  margin: 4px 0;
  padding: 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  width: 100%;
`;

const RoleOption = styled.div<{ $active?: boolean; $type: 'affirmative' | 'negative' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => props.$active && props.$type === 'affirmative' && `
    background: rgba(65, 87, 255, 0.1);
    color: #4157ff;
  `}
  
  ${props => props.$active && props.$type === 'negative' && `
    background: rgba(255, 65, 87, 0.1);
    color: #ff4157;
  `}
  
  &:hover {
    background: ${props => props.$type === 'affirmative' 
      ? 'rgba(65, 87, 255, 0.05)' 
      : 'rgba(255, 65, 87, 0.05)'};
  }
`;

const DebateOrder = styled.span`
  font-size: 12px;
  opacity: 0.7;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
  width: 100%;
`;

const CharacterSelect = styled.div`
  margin: 4px 0;
  padding: 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  width: 100%;
`;

const CharacterOption = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CharacterName = styled.div`
  font-weight: 500;
`;

const CharacterDescription = styled.div`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
`;

const TakeoverMessage = styled.div`
  margin: 4px 0;
  padding: 8px;
  background: rgba(255, 144, 65, 0.05);
  border-radius: 6px;
  color: #ff9041;
  text-align: center;
  font-size: 14px;
`;

const ModelInfo = styled.div`
  margin: 4px 0;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
`;

const ModelTag = styled.span`
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
`;

interface RoleAssignmentPanelProps {
  players: Player[];
  config: RoleAssignmentConfig;
  debateFormat: 'free' | 'structured';
  onAssignRole: (playerId: string, role: UnifiedRole) => void;
  onAutoAssign: () => void;
  onReset: () => void;
  onTakeoverPlayer: (playerId: string, playerName: string, isTakeover: boolean) => void;
  onRemovePlayer: (playerId: string) => void;
  onAddAIPlayer?: () => void;
  onStartDebate?: () => void;
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
  const { state: modelState } = useModel();
  const [takeoverModalVisible, setTakeoverModalVisible] = useState(false);
  const [takeoverPlayerId, setTakeoverPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const { state: gameConfig, setState: setGameConfig } = useStore('gameConfig');

  useEffect(() => {
    logger.info('roleAssignment', '组件已初始化', { initialState: gameConfig });
    return () => {
      logger.info('roleAssignment', '组件已卸载');
    };
  }, []);

  // 获取已被选择的角色ID列表
  const selectedCharacterIds = players
    .filter(p => p.characterId)
    .map(p => p.characterId) as string[];

  // 检查是否已有人类玩家
  const hasHumanPlayer = players.some(p => !p.isAI);

  const handleTakeoverClick = (playerId: string) => {
    if (hasHumanPlayer) {
      Modal.warning({
        title: '无法接管',
        content: '已有一名人类玩家，不能再接管其他角色',
      });
      return;
    }
    setTakeoverPlayerId(playerId);
    setTakeoverModalVisible(true);
    setPlayerName('');
  };

  const handleTakeoverConfirm = () => {
    if (takeoverPlayerId && playerName.trim()) {
      onTakeoverPlayer(takeoverPlayerId, playerName.trim(), true);
      setTakeoverModalVisible(false);
      setTakeoverPlayerId(null);
      setPlayerName('');
    }
  };

  const handleCancelTakeover = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      onTakeoverPlayer(playerId, `AI选手${player.name.match(/\d+/)?.[0] || ''}`, false);
    }
  };

  const handleAssignRole = (playerId: string, role: UnifiedRole) => {
    onAssignRole(playerId, role);
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

  const handleSelectCharacter = (playerId: string, characterId: string) => {
    onSelectCharacter(playerId, characterId);
    const updatedPlayers = players.map(p => 
      p.id === playerId ? { ...p, characterId } : p
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
              <AntButton onClick={handleAutoAssign}>自动分配角色</AntButton>
              <AntButton onClick={handleReset}>重置角色</AntButton>
            </>
          )}
        {onAddAIPlayer && (
            <AntButton type="primary" onClick={onAddAIPlayer}>
            添加AI选手
            </AntButton>
        )}
        </ButtonGroup>
      </Header>

      <PlayerList>
        {players.map((player) => {
          const isAffirmative = player.role.startsWith('affirmative');
          const isNegative = player.role.startsWith('negative');
          const selectedCharacter = player.characterId 
            ? characterState.characters.find(c => c.id === player.characterId)
            : undefined;
          
          // 获取角色关联的模型信息
          const modelId = selectedCharacter?.callConfig?.type === 'direct' 
            ? selectedCharacter.callConfig.direct?.modelId 
            : undefined;
          const characterModel = modelId
            ? modelState.models.find(m => m.id === modelId)
            : undefined;

          // 过滤掉已被其他玩家选择的角色
          const availableCharacters = characterState.characters.filter(
            character => !selectedCharacterIds.includes(character.id) || character.id === player.characterId
          );

          return (
            <PlayerCard 
              key={player.id}
              $isAffirmative={debateFormat === 'structured' && isAffirmative}
              $isNegative={debateFormat === 'structured' && isNegative}
              $isHuman={!player.isAI}
            >
              <AvatarWrapper>
                <StyledAvatar 
                  src={selectedCharacter?.avatar}
                  icon={player.isAI ? <RobotOutlined /> : <UserOutlined />}
                />
                {player.isAI && <AIBadge>AI</AIBadge>}
              </AvatarWrapper>
              
              <CardHeader>
                <PlayerName>{player.name}</PlayerName>
                <CharacterInfo>
                  {selectedCharacter && (
                    <>
                      <div className="character-description">
                        {selectedCharacter.description}
                      </div>
                      {characterModel && (
                        <ModelInfo>
                          <ModelTag>{characterModel.provider}</ModelTag>
                          <ModelTag>{characterModel.model}</ModelTag>
                        </ModelInfo>
                      )}
                    </>
                  )}
                </CharacterInfo>
              </CardHeader>

              {player.isAI ? (
                <CharacterSelect>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="选择AI角色"
                    value={player.characterId}
                    onChange={(value) => handleSelectCharacter(player.id, value || '')}
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
                          {character.description && (
                            <CharacterDescription>
                              {character.description}
                            </CharacterDescription>
                          )}
                        </CharacterOption>
                      </Select.Option>
                    ))}
                  </Select>
                </CharacterSelect>
              ) : (
                <TakeoverMessage>
                  该角色已被人类接管
                </TakeoverMessage>
              )}

              {debateFormat === 'structured' && (
                <RoleSelector>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <RoleOption 
                        $active={isAffirmative}
                        $type="affirmative"
                        onClick={() => handleRoleChange(player.id, 'affirmative', player.role)}
                      >
                        正方
                        {isAffirmative && (
                          <DebateOrder>
                            {player.role.replace('affirmative', '')}号
                          </DebateOrder>
                        )}
                      </RoleOption>
                      <RoleOption 
                        $active={isNegative}
                        $type="negative"
                        onClick={() => handleRoleChange(player.id, 'negative', player.role)}
                      >
                        反方
                        {isNegative && (
                          <DebateOrder>
                            {player.role.replace('negative', '')}号
                          </DebateOrder>
                        )}
                      </RoleOption>
                    </Space>
                  </Space>
                </RoleSelector>
              )}

              <ActionButtons>
                {player.isAI ? (
                  <Tooltip title="接管为人类玩家">
                    <AntButton 
                      icon={<SwapOutlined />}
                      onClick={() => handleTakeoverClick(player.id)}
                      disabled={hasHumanPlayer && player.isAI}
                    >
                      接管
                    </AntButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="取消接管">
                    <AntButton 
                      icon={<SwapOutlined />}
                      onClick={() => handleCancelTakeover(player.id)}
                    >
                      取消接管
                    </AntButton>
                  </Tooltip>
                )}
                <AntButton 
                  danger
                  onClick={() => onRemovePlayer(player.id)}
                >
                  移除
                </AntButton>
              </ActionButtons>
          </PlayerCard>
          );
        })}
      </PlayerList>

      <Modal
        title="接管AI选手"
        open={takeoverModalVisible}
        onOk={handleTakeoverConfirm}
        onCancel={() => setTakeoverModalVisible(false)}
        okButtonProps={{ disabled: !playerName.trim() }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>请输入您的名字：</div>
            <Input
            placeholder="请输入玩家名称"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            onPressEnter={handleTakeoverConfirm}
          />
        </Space>
      </Modal>
    </Container>
  );
}; 