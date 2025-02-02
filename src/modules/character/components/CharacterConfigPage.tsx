import React from 'react';
import { Typography, Alert } from 'antd';
import { CharacterConfigForm } from './CharacterConfigForm';
import { useCharacter } from '../context/CharacterContext';
import type { CharacterConfig } from '../types';

const { Title } = Typography;

export const CharacterConfigPage: React.FC = () => {
  const { state, dispatch } = useCharacter();

  const handleSave = (values: CharacterConfig) => {
    if (values.id) {
      dispatch({ type: 'UPDATE_CHARACTER', payload: values });
    } else {
      const newCharacter = {
        ...values,
        id: `char_${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      dispatch({ type: 'ADD_CHARACTER', payload: newCharacter });
    }
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_CHARACTER', payload: id });
  };

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">AI角色配置</Title>
      
      <Alert
        message="提示"
        description="在这里配置AI辩手的基本信息、人设和关联模型。配置完成后，AI辩手将根据这些设置在辩论中表现出相应的特征。"
        type="info"
        showIcon
        className="mb-6"
      />

      <CharacterConfigForm
        onSave={handleSave}
        onDelete={state.characters.length > 0 ? () => handleDelete(state.characters[0].id) : undefined}
        initialValues={state.characters[0]}
      />
    </div>
  );
}; 