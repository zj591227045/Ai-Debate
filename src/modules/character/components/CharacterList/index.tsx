import React, { useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { ModelProvider } from '../../../model/context/ModelContext';
import CharacterForm from '../CharacterForm';
import './styles.css';

export default function CharacterList() {
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
    if (window.confirm('确定要删除这个角色吗？')) {
      dispatch({ type: 'DELETE_CHARACTER', payload: id });
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingCharacter(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCharacter(null);
  };

  return (
    <ModelProvider>
      <div className="character-list">
        <div className="character-list-header">
          <h2>AI角色列表</h2>
          <button className="btn-primary" onClick={handleAddCharacter}>
            添加角色
          </button>
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
            <div key={character.id} className="character-card">
              <div className="character-avatar">
                {character.avatar ? (
                  <img src={character.avatar} alt={character.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {character.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="character-info">
                <h3>{character.name}</h3>
                <p className="character-description">
                  {character.description || '暂无描述'}
                </p>
                <div className="character-tags">
                  <span className="tag">{character.persona.background}</span>
                  <span className="tag">{character.persona.speakingStyle}</span>
                </div>
              </div>

              <div className="character-actions">
                <button
                  className="btn-secondary"
                  onClick={() => handleEditCharacter(character.id)}
                >
                  编辑
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteCharacter(character.id)}
                >
                  删除
                </button>
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
    </ModelProvider>
  );
} 