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
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(167,187,255,0.2);
  padding: 2rem;
  box-shadow: 
    0 8px 32px 0 rgba(31, 38, 135, 0.37),
    inset 0 0 30px rgba(167,187,255,0.1);
  width: 100%;
  min-height: calc(100vh - 4rem);
  box-sizing: border-box;
`;

// 修改角色网格容器
const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1.5rem;
  width: 100%;
  margin-top: 1.5rem;
`;

// 修改角色卡片样式
const CharacterCard = styled(GlassContainer)<{ $type?: 'affirmative' | 'negative' | 'human' }>`
  margin: 0;
  padding: 1.5rem;
  min-height: auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  ${props => props.$type === 'affirmative' && `
    border-left: 4px solid #4157ff;
    background: linear-gradient(to right, rgba(65, 87, 255, 0.05), rgba(255, 255, 255, 0.05));
  `}
  
  ${props => props.$type === 'negative' && `
    border-left: 4px solid #ff4157;
    background: linear-gradient(to right, rgba(255, 65, 87, 0.05), rgba(255, 255, 255, 0.05));
  `}
  
  ${props => props.$type === 'human' && `
    border-left: 4px solid #ff9041;
    background: linear-gradient(to right, rgba(255, 144, 65, 0.05), rgba(255, 255, 255, 0.05));
  `}

  &:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 12px 32px 0 rgba(31, 38, 135, 0.47),
      inset 0 0 30px rgba(167,187,255,0.2);
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

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const AvatarWrapper = styled.div`
  position: relative;
  
  .ant-avatar {
    border: 2px solid rgba(167,187,255,0.3);
    transition: all 0.3s ease;
    
    &:hover {
      border-color: rgba(167,187,255,0.6);
      box-shadow: 0 0 15px rgba(167,187,255,0.3);
    }
  }
`;

const AIBadge = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: linear-gradient(45deg, rgba(9,9,121,0.9), rgba(0,57,89,0.9));
  color: #E8F0FF;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(31, 38, 135, 0.3);
`;

const CharacterInfo = styled.div`
  flex: 1;
`;

const CharacterName = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #E8F0FF;
  text-shadow: 
    0 0 10px rgba(167,187,255,0.5),
    0 0 20px rgba(167,187,255,0.3);
`;

const CharacterDescription = styled.p`
  color: rgba(232,240,255,0.9);
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0.5rem 0;
  text-shadow: 0 0 10px rgba(167,187,255,0.3);
`;

const RoleSelector = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(167,187,255,0.05);
  border-radius: 12px;
  border: 1px solid rgba(167,187,255,0.1);
`;

const RoleOption = styled.div<{ $active?: boolean; $type: 'affirmative' | 'negative' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: ${props => props.$active ? '#E8F0FF' : 'rgba(232,240,255,0.7)'};
  
  ${props => props.$active && props.$type === 'affirmative' && `
    background: linear-gradient(45deg, rgba(65, 87, 255, 0.2), rgba(65, 87, 255, 0.1));
    box-shadow: 0 4px 12px rgba(65, 87, 255, 0.2);
  `}
  
  ${props => props.$active && props.$type === 'negative' && `
    background: linear-gradient(45deg, rgba(255, 65, 87, 0.2), rgba(255, 65, 87, 0.1));
    box-shadow: 0 4px 12px rgba(255, 65, 87, 0.2);
  `}
  
  &:hover {
    background: ${props => props.$type === 'affirmative' 
      ? 'rgba(65, 87, 255, 0.15)' 
      : 'rgba(255, 65, 87, 0.15)'};
    transform: translateY(-1px);
  }
`;

const DebateOrder = styled.span`
  font-size: 0.8rem;
  opacity: 0.8;
  background: rgba(167,187,255,0.1);
  padding: 2px 6px;
  border-radius: 4px;
`;

const CharacterSelect = styled.div`
  margin-top: 1rem;

  .ant-radio-group {
    width: 100%;
  }

  .ant-radio-button-wrapper {
    background: rgba(167,187,255,0.05);
    border-color: rgba(167,187,255,0.2);
    color: rgba(232,240,255,0.9);
    transition: all 0.3s ease;

    &:hover {
      background: rgba(167,187,255,0.1);
      color: #E8F0FF;
    }

    &.ant-radio-button-wrapper-checked {
      background: linear-gradient(45deg, rgba(9,9,121,0.9), rgba(0,57,89,0.9));
      border-color: rgba(167,187,255,0.3);
      box-shadow: 0 4px 12px rgba(31, 38, 135, 0.3);
    }
  }
`;

// 添加删除按钮样式
const DeleteButton = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 65, 87, 0.1);
  border: 1px solid rgba(255, 65, 87, 0.2);
  color: rgba(255, 65, 87, 0.9);
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0.6;

  &:hover {
    opacity: 1;
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
  gap: 1rem;
  margin-top: auto;
  padding-top: 1.5rem;

  .ant-btn {
    flex: 1;
    height: 36px;
    background: rgba(167,187,255,0.1);
    border-color: rgba(167,187,255,0.2);
    color: rgba(232,240,255,0.9);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;

    .anticon {
      font-size: 14px;
      margin-right: 6px;
    }

    &:hover {
      background: rgba(167,187,255,0.2);
      border-color: rgba(167,187,255,0.3);
      color: #E8F0FF;
      transform: translateY(-1px);
    }
  }
`;

const ModelInfo = styled.div`
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: rgba(232,240,255,0.7);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ModelTag = styled.span`
  background: rgba(167,187,255,0.1);
  padding: 2px 8px;
  border-radius: 4px;
  color: rgba(232,240,255,0.9);
  font-weight: 500;
`;

const TabsContainer = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 2rem;
  }

  .ant-tabs-tab {
    color: rgba(232,240,255,0.7);
    transition: all 0.3s ease;

    &:hover {
      color: rgba(232,240,255,0.9);
    }
  }

  .ant-tabs-tab-active {
    .ant-tabs-tab-btn {
      color: #E8F0FF !important;
      text-shadow: 0 0 10px rgba(167,187,255,0.5);
    }
  }

  .ant-tabs-ink-bar {
    background: linear-gradient(90deg, #4157ff, #0057ff);
  }
`;

const AddCharacterButton = styled(Button)`
  background: linear-gradient(45deg, rgba(9,9,121,0.9), rgba(0,57,89,0.9));
  border: 1px solid rgba(167,187,255,0.3);
  color: #E8F0FF;
  height: 40px;
  padding: 0 1.5rem;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(31, 38, 135, 0.3);
    border-color: rgba(167,187,255,0.4);
    color: #E8F0FF;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(232,240,255,0.7);
  background: rgba(167,187,255,0.05);
  border-radius: 12px;
  border: 1px dashed rgba(167,187,255,0.2);

  p {
    margin: 1rem 0;
    font-size: 1rem;
    line-height: 1.6;
  }
`;

// 修改头部样式
const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  width: 100%;
`;

// 添加StyledModal组件
const StyledModal = styled(Modal)`
  .ant-modal-content {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(167,187,255,0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  }

  .ant-modal-header {
    background: transparent;
    border-bottom: 1px solid rgba(167,187,255,0.1);
  }

  .ant-modal-title {
    color: #E8F0FF;
  }

  .ant-modal-close {
    color: rgba(232,240,255,0.7);
    
    &:hover {
      color: #E8F0FF;
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