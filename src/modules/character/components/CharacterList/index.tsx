import React, { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { ModelProvider } from '../../../model/context/ModelContext';
import { Button, Modal, message, Tabs } from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import CharacterForm from '../CharacterForm';
import { TemplateManager } from '../TemplateManager';
import { CharacterConfig } from '../../types';
import { CharacterTemplate } from '../../types/template';
import './styles.css';

const { TabPane } = Tabs;

interface CharacterListProps {
  onSelect?: (character: CharacterConfig) => void;
  onEdit?: (character: CharacterConfig) => void;
  onDelete?: (character: CharacterConfig) => void;
}

export default function CharacterList({ onSelect, onEdit, onDelete }: CharacterListProps) {
  const { state, dispatch } = useCharacter();
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
      title: '确定要删除这个角色吗？',
      content: '删除后将无法恢复',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        dispatch({ type: 'DELETE_CHARACTER', payload: id });
      },
    });
  };

  const handleSaveAsTemplate = (character: CharacterConfig) => {
    const template: CharacterTemplate = {
      id: `template_${Date.now()}`,
      name: `${character.name}模板`,
      description: character.description || '',
      persona: character.persona,
      callConfig: character.callConfig,
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
                {state.characters.map((character) => (
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
                          Modal.confirm({
                            title: '确认删除',
                            content: `确定要删除角色"${character.name}"吗？删除后将无法恢复。`,
                            okText: '确定删除',
                            cancelText: '取消',
                            okButtonProps: { danger: true },
                            onOk: () => handleDeleteCharacter(character.id),
                            wrapClassName: 'delete-confirm-modal',
                            centered: true,
                            okCancel: true,
                            maskClosable: true,
                            width: 400,
                            style: { top: 0 },
                            bodyStyle: { padding: '16px' },
                            cancelButtonProps: {
                              style: { float: 'right', marginLeft: 8 }
                            }
                          });
                        }}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ))}

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