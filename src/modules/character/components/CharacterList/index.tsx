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

// 修改基础容器样式
const GlassContainer = styled.div`
  background: rgba(59, 60, 152, 0.2);
  border-radius: 16px;
  border: 1px solid rgba(65, 87, 255, 0.1);
  padding: 24px;
  width: 100%;
  min-height: calc(100vh - 4rem);
  box-sizing: border-box;
`;

// 修改角色网格容器
const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
  width: 100%;
  margin-top: 24px;
`;

// 修改角色卡片样式
const CharacterCard = styled(GlassContainer)<{ $type?: 'affirmative' | 'negative' | 'human' }>`
  margin: 0;
  padding: 20px;
  min-height: auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;
  background: rgba(59, 60, 152, 0.3);
  
  ${props => props.$type === 'affirmative' && `
    border-left: 4px solid #4157ff;
    background: rgba(65, 87, 255, 0.15);
  `}
  
  ${props => props.$type === 'negative' && `
    border-left: 4px solid #ff4157;
    background: rgba(255, 65, 87, 0.15);
  `}
  
  ${props => props.$type === 'human' && `
    border-left: 4px solid #ff9041;
    background: rgba(255, 144, 65, 0.15);
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
`;

const AvatarWrapper = styled.div`
  position: relative;
  
  .ant-avatar {
    border: 2px solid rgba(65, 87, 255, 0.5);
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #4157ff;
    }
  }
`;

const AIBadge = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: #4157ff;
  color: #fff;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
`;

const CharacterInfo = styled.div`
  flex: 1;
`;

const CharacterName = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
`;

const CharacterDescription = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  line-height: 1.6;
  margin: 8px 0;
`;

const RoleSelector = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;
  padding: 16px;
  background: rgba(65, 87, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(65, 87, 255, 0.2);
`;

const RoleOption = styled.div<{ $active?: boolean; $type: 'affirmative' | 'negative' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: ${props => props.$active ? '#fff' : 'rgba(255, 255, 255, 0.6)'};
  
  ${props => props.$active && props.$type === 'affirmative' && `
    background: rgba(65, 87, 255, 0.2);
    border: 1px solid rgba(65, 87, 255, 0.3);
  `}
  
  ${props => props.$active && props.$type === 'negative' && `
    background: rgba(255, 65, 87, 0.2);
    border: 1px solid rgba(255, 65, 87, 0.3);
  `}
  
  &:hover {
    background: ${props => props.$type === 'affirmative' 
      ? 'rgba(65, 87, 255, 0.2)' 
      : 'rgba(255, 65, 87, 0.2)'};
  }
`;

const DebateOrder = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
`;

const CharacterSelect = styled.div`
  margin-top: 16px;

  .ant-radio-group {
    width: 100%;
  }

  .ant-radio-button-wrapper {
    background: rgba(59, 60, 152, 0.3);
    border-color: rgba(65, 87, 255, 0.2);
    color: rgba(255, 255, 255, 0.6);

    &:hover {
      color: #4157ff;
    }

    &.ant-radio-button-wrapper-checked {
      background: rgba(65, 87, 255, 0.2);
      border-color: #4157ff;
      color: #fff;
    }
  }
`;

// 添加删除按钮样式
const DeleteButton = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 65, 87, 0.1);
  border: 1px solid rgba(255, 65, 87, 0.2);
  color: #ff4d4f;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 65, 87, 0.2);
    border-color: rgba(255, 65, 87, 0.3);
    transform: scale(1.1);
  }

  .anticon {
    font-size: 16px;
  }
`;

// 修改按钮组样式
const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .ant-btn {
    flex: 1;
    height: 36px;
    background: rgba(59, 60, 152, 0.3);
    border-color: rgba(65, 87, 255, 0.2);
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;

    .anticon {
      font-size: 14px;
      margin-right: 6px;
    }

    &:hover {
      background: rgba(65, 87, 255, 0.2);
      border-color: #4157ff;
      color: #fff;
      transform: translateY(-1px);
    }

    &:disabled {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.3);
    }
  }
`;

const ModelInfo = styled.div`
  margin-top: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModelTag = styled.span`
  background: rgba(65, 87, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  color: #4157ff;
  font-weight: 500;
`;

const TabsContainer = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 24px;
  }

  .ant-tabs-tab {
    color: rgba(255, 255, 255, 0.6);

    &:hover {
      color: #4157ff;
    }
  }

  .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: #4157ff;
  }

  .ant-tabs-ink-bar {
    background: #4157ff;
  }
`;

const AddCharacterButton = styled(Button)`
  background: #4157ff;
  border: 1px solid #4157ff;
  color: #fff;
  height: 40px;
  padding: 0 24px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: #6677ff;
    border-color: #6677ff;
    color: #fff;
    transform: translateY(-2px);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(65, 87, 255, 0.1);
  border-radius: 8px;
  border: 1px dashed rgba(65, 87, 255, 0.2);

  p {
    margin: 16px 0;
    font-size: 16px;
    line-height: 1.6;
  }
`;

// 修改头部样式
const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  width: 100%;
`;

// 添加StyledModal组件
const StyledModal = styled(Modal)`
  .ant-modal-content {
    background: rgba(59, 60, 152, 0.95);
    border: 1px solid rgba(65, 87, 255, 0.1);
  }

  .ant-modal-header {
    background: transparent;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .ant-modal-title {
    color: #fff;
  }

  .ant-modal-close {
    color: rgba(255, 255, 255, 0.6);
    
    &:hover {
      color: #fff;
    }
  }

  .ant-modal-body {
    padding: 0;
  }
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
    <CharacterCard 
      $type={isAffirmative ? 'affirmative' : isNegative ? 'negative' : 'human'}
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
        <CharacterInfo>
          <CharacterName>{player.name}</CharacterName>
          {selectedCharacter && (
            <CharacterDescription>
              {selectedCharacter.description || '暂无描述'}
            </CharacterDescription>
          )}
        </CharacterInfo>
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
    </CharacterCard>
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
      <GlassContainer>
        <TabsContainer defaultActiveKey="characters">
          <TabPane tab="角色列表" key="characters">
            <ListHeader>
              <CharacterName>AI角色列表</CharacterName>
              <AddCharacterButton type="primary" onClick={handleAddCharacter}>
                添加角色
              </AddCharacterButton>
            </ListHeader>

              {showForm && (
              <StyledModal
                visible={showForm}
                onCancel={handleFormCancel}
                footer={null}
                width={800}
                centered
                destroyOnClose
              >
                <CharacterForm
                  character={
                    editingCharacter
                      ? state.characters.find((c) => c.id === editingCharacter)
                      : undefined
                  }
                  onSubmit={handleFormSubmit}
                  onCancel={handleFormCancel}
                />
              </StyledModal>
              )}

            <CharacterGrid>
                {state.characters.map((character) => {
                  const modelId = character.callConfig?.type === 'direct' 
                    ? character.callConfig.direct?.modelId 
                    : undefined;
                  const characterModel = modelId
                    ? models.find((model: ModelConfig) => model.id === modelId)
                    : undefined;

                  return (
                  <CharacterCard
                      key={character.id}
                      onClick={() => handleSelect(character)}
                  >
                    <DeleteButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCharacter(character.id);
                      }}
                    >
                      <DeleteOutlined />
                    </DeleteButton>
                    <CardHeader>
                      <AvatarWrapper>
                        <Avatar 
                          size={64} 
                          src={character.avatar}
                          icon={<RobotOutlined />}
                        />
                        <AIBadge>AI</AIBadge>
                      </AvatarWrapper>
                      <CharacterInfo>
                        <CharacterName>{character.name}</CharacterName>
                        <CharacterDescription>
                          {character.description || '暂无描述'}
                        </CharacterDescription>
                          {characterModel && (
                            <ModelInfo>
                              <ModelTag>{characterModel.provider}</ModelTag>
                              <ModelTag>{characterModel.model}</ModelTag>
                            </ModelInfo>
                          )}
                      </CharacterInfo>
                    </CardHeader>
                    <ActionButtons>
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
                        保存模板
                        </Button>
                    </ActionButtons>
                  </CharacterCard>
                  );
                })}

                {state.characters.length === 0 && (
                <EmptyState>
                    <p>暂无角色，点击"添加角色"创建新角色</p>
                </EmptyState>
                )}
            </CharacterGrid>
          </TabPane>
          
          <TabPane tab="模板管理" key="templates">
            <TemplateManager />
          </TabPane>
        </TabsContainer>
      </GlassContainer>
    </ModelProvider>
  );
} 