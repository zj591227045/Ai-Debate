import React, { useState } from 'react';
import RoleAssignment from '../RoleAssignment';
import CharacterList from '../../../character/components/CharacterList';
import ModelList from '../../../model/components/ModelList';
import { ModelProvider } from '../../../model/context/ModelContext';
import './styles.css';

type TabKey = 'roles' | 'characters' | 'models';

export default function GameConfig() {
  const [activeTab, setActiveTab] = useState<TabKey>('roles');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'roles':
        return <RoleAssignment />;
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
    <div className="game-config">
      <div className="game-config-header">
        <h1>游戏配置</h1>
      </div>
      
      <div className="game-config-tabs">
        <button
          className={`tab-button ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          开局配置
        </button>
        <button
          className={`tab-button ${activeTab === 'characters' ? 'active' : ''}`}
          onClick={() => setActiveTab('characters')}
        >
          AI角色配置
        </button>
        <button
          className={`tab-button ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          模型管理
        </button>
      </div>

      <div className="game-config-content">
        {renderTabContent()}
      </div>
    </div>
  );
} 