import React, { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { ModelProvider, useModel } from '../../../model/context/ModelContext';
import { Button, Modal, message, Tabs, Avatar, Card, Radio, Space, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined, UserOutlined, RobotOutlined, SwapOutlined } from '@ant-design/icons';
import CharacterForm from '../CharacterForm';
import { TemplateManager } from '../TemplateManager';
import { CharacterConfig } from '../../types';
import { CharacterTemplate } from '../../types/template';
import './styles.css';
import styled from '@emotion/styled';
import type { ModelConfig } from '../../../model/types';

const { TabPane } = Tabs;

const PlayerCard = styled(Card)<{ $isAffirmative?: boolean; $isNegative?: boolean; $isHuman?: boolean }>`
  margin-bottom: 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  
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

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
`;

const AvatarWrapper = styled.div`
  position: relative;
`;

const AIBadge = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: #4157ff;
  color: white;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 12px;
`;

const PlayerInfo = styled.div`
  flex: 1;
`;

const PlayerName = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
`;

const RoleSelector = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
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

const CharacterSelect = styled.div`
  margin-top: 16px;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

const ModelInfo = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ModelTag = styled.span`
  background: rgba(0, 0, 0, 0.03);
  padding: 2px 6px;
  border-radius: 4px;
  color: rgba(0, 0, 0, 0.65);
`;

interface CharacterListProps {
  onSelect?: (character: CharacterConfig) => void;
  onEdit?: (character: CharacterConfig) => void;
  onDelete?: (character: CharacterConfig) => void;
}

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    role: string;
    isAI: boolean;
    characterId?: string;
  };
  onRoleChange: (role: string) => void;
  onCharacterSelect: (characterId: string) => void;
  onTakeover: () => void;
}

export const PlayerCardComponent: React.FC<PlayerCardProps> = ({
  player,
  onRoleChange,
  onCharacterSelect,
  onTakeover,
}) => {
  const { state: characterState } = useCharacter();
  const selectedCharacter = characterState.characters.find(c => c.id === player.characterId);
  const isAffirmative = player.role.startsWith('affirmative');
  const isNegative = player.role.startsWith('negative');
  
  return (
    <PlayerCard 
      $isAffirmative={isAffirmative} 
      $isNegative={isNegative}
      $isHuman={!player.isAI}
    >
      <CardHeader>
        <AvatarWrapper>
          <Avatar 
            size={48} 
            src={selectedCharacter?.avatar}
            icon={player.isAI ? <RobotOutlined /> : <UserOutlined />}
          />
          {player.isAI && <AIBadge>AI</AIBadge>}
        </AvatarWrapper>
        <PlayerInfo>
          <PlayerName>{player.name}</PlayerName>
          {selectedCharacter && (
            <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>
              {selectedCharacter.description || '暂无描述'}
            </div>
          )}
        </PlayerInfo>
      </CardHeader>

      <RoleSelector>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <RoleOption 
              $active={isAffirmative} 
              $type="affirmative"
              onClick={() => onRoleChange('affirmative')}
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
              onClick={() => onRoleChange('negative')}
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

      {player.isAI && (
        <CharacterSelect>
          <Radio.Group 
            value={player.characterId}
            onChange={e => onCharacterSelect(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {characterState.characters.map(character => (
                <Radio.Button key={character.id} value={character.id}>
                  <Space>
                    <span>{character.name}</span>
                    {character.description && (
                      <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>
                        {character.description}
                      </span>
                    )}
                  </Space>
                </Radio.Button>
              ))}
            </Space>
          </Radio.Group>
        </CharacterSelect>
      )}

      <ActionButtons>
        {player.isAI ? (
          <Tooltip title="接管为人类玩家">
            <Button 
              icon={<SwapOutlined />} 
              onClick={onTakeover}
            >
              接管
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title="当前为人类玩家">
            <Button disabled icon={<UserOutlined />}>
              已接管
            </Button>
          </Tooltip>
        )}
      </ActionButtons>
    </PlayerCard>
  );
};

export default function CharacterList({ onSelect, onEdit, onDelete }: CharacterListProps) {
  const { state, dispatch } = useCharacter();
  const { models } = useModel();
  const [showForm, setShowForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<string | null>(null);

  const handleAddCharacter = () => {
    setEditingCharacter(null);
    setShowForm(true);
  };

  const handleEditCharacter = (id: string) => {
    setEditingCharacter(id);
    setShowForm(true);
  };

  const handleDeleteCharacter = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后将无法恢复',
      okText: '确定删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          dispatch({ type: 'DELETE_CHARACTER', payload: id });
          message.success('角色已删除');
        } catch (error) {
          console.error('删除角色失败:', error);
          message.error('删除失败: ' + (error instanceof Error ? error.message : '未知错误'));
        }
      },
      wrapClassName: 'delete-confirm-modal',
      centered: true,
      okCancel: true,
      maskClosable: true,
      width: 400,
      styles: {
        body: { padding: '16px' }
      }
    });
  };

  const handleSaveAsTemplate = (character: CharacterConfig) => {
    const template: CharacterTemplate = {
      id: `template_${Date.now()}`,
      name: `${character.name}模板`,
      description: character.description || '',
      persona: character.persona,
      callConfig: character.callConfig,
      isTemplate: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    dispatch({ type: 'ADD_TEMPLATE', payload: template });
    message.success('已保存为模板');
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingCharacter(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCharacter(null);
  };

  const handleSelect = (character: CharacterConfig) => {
    onSelect?.(character);
  };

  const handleEdit = (e: React.MouseEvent, character: CharacterConfig) => {
    e.stopPropagation();
    onEdit?.(character);
  };

  const handleDelete = (e: React.MouseEvent, character: CharacterConfig) => {
    e.stopPropagation();
    onDelete?.(character);
  };

  return (
    <ModelProvider>
      <div className="character-management">
        <Tabs defaultActiveKey="characters">
          <TabPane tab="角色列表" key="characters">
            <div className="character-list">
              <div className="character-list-header">
                <h2>AI角色列表</h2>
                <Button type="primary" onClick={handleAddCharacter}>
                  添加角色
                </Button>
              </div>

              {showForm && (
                <div className="character-form-modal">
                  <div className="character-form-modal-content">
                    <CharacterForm
                      character={
                        editingCharacter
                          ? state.characters.find((c) => c.id === editingCharacter)
                          : undefined
                      }
                      onSubmit={handleFormSubmit}
                      onCancel={handleFormCancel}
                    />
                  </div>
                </div>
              )}

              <div className="character-grid">
                {state.characters.map((character) => {
                  // 获取角色关联的模型信息
                  const modelId = character.callConfig?.type === 'direct' 
                    ? character.callConfig.direct?.modelId 
                    : undefined;
                  const characterModel = modelId
                    ? models.find((model: ModelConfig) => model.id === modelId)
                    : undefined;

                  return (
                    <div
                      key={character.id}
                      className="character-item"
                      onClick={() => handleSelect(character)}
                    >
                      <div className="character-info">
                        <div className="character-avatar">
                          {character.avatar ? (
                            <img src={character.avatar} alt={character.name} />
                          ) : (
                            <div className="avatar-placeholder">
                              {character.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="character-details">
                          <h3>{character.name}</h3>
                          <p>{character.description}</p>
                          {characterModel && (
                            <ModelInfo>
                              <ModelTag>{characterModel.provider}</ModelTag>
                              <ModelTag>{characterModel.model}</ModelTag>
                            </ModelInfo>
                          )}
                        </div>
                      </div>
                      <div className="character-actions">
                        <Button
                          icon={<EditOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCharacter(character.id);
                          }}
                        >
                          编辑
                        </Button>
                        <Button
                          icon={<SaveOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveAsTemplate(character);
                          }}
                        >
                          保存为模板
                        </Button>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCharacter(character.id);
                          }}
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {state.characters.length === 0 && (
                  <div className="empty-state">
                    <p>暂无角色，点击"添加角色"创建新角色</p>
                  </div>
                )}
              </div>
            </div>
          </TabPane>
          
          <TabPane tab="模板管理" key="templates">
            <TemplateManager />
          </TabPane>
        </Tabs>
      </div>
    </ModelProvider>
  );
} 