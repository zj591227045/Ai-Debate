import React, { useState, useEffect } from 'react';
import { Typography, Alert } from 'antd';
import { CharacterConfigForm } from './CharacterConfigForm';
import CharacterList from './CharacterList';
import { StateManager } from '../../../store/unified/StateManager';
import type { CharacterConfig } from '../types';
import type { UnifiedState } from '../../../store/unified';

const { Title } = Typography;

export const CharacterConfigPage: React.FC = () => {
  const stateManager = StateManager.getInstance();
  const [characters, setCharacters] = useState<CharacterConfig[]>(() => {
    const state = stateManager.getState();
    return Object.values(state.characters.byId);
  });

  useEffect(() => {
    const unsubscribe = stateManager.subscribe((newState: UnifiedState) => {
      setCharacters(Object.values(newState.characters.byId));
    });
    return () => unsubscribe();
  }, []);

  const handleCharacterSelect = (character: CharacterConfig) => {
    stateManager.dispatch({
      type: 'CHARACTER_SELECTED',
      payload: { id: character.id }
    });
  };

  const handleCharacterEdit = (character: CharacterConfig) => {
    stateManager.dispatch({
      type: 'CHARACTER_UPDATED',
      payload: { id: character.id, changes: character }
    });
  };

  const handleCharacterDelete = (character: CharacterConfig) => {
    stateManager.dispatch({
      type: 'CHARACTER_DELETED',
      payload: { id: character.id }
    });
  };

  const handleSave = (values: CharacterConfig) => {
    if (values.id) {
      stateManager.dispatch({
        type: 'CHARACTER_UPDATED',
        payload: { id: values.id, changes: values }
      });
    } else {
      const newCharacter = {
        ...values,
        id: `char_${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      stateManager.dispatch({
        type: 'CHARACTER_ADDED',
        payload: newCharacter
      });
    }
  };

  return (
    <div className="character-config-page">
      <Title level={2}>角色配置</Title>
      <Alert
        message="配置AI角色的基本信息、人设和调用方式"
        type="info"
        showIcon
        className="mb-6"
      />

      <CharacterList
        onSelect={handleCharacterSelect}
        onEdit={(characterId: string) => {
          const character = characters.find(c => c.id === characterId);
          if (character) {
            handleCharacterEdit(character);
          }
        }}
        onDelete={(characterId: string) => {
          const character = characters.find(c => c.id === characterId);
          if (character) {
            handleCharacterDelete(character);
          }
        }}
      />

      <CharacterConfigForm
        onSave={handleSave}
        onDelete={characters.length > 0 ? () => handleCharacterDelete(characters[0]) : undefined}
        initialValues={characters[0]}
      />
    </div>
  );
}; 