import React, { useState } from 'react';
import './styles.css';

interface Role {
  id: string;
  name: string;
  type: 'human' | 'ai';
  modelId?: string;
}

export default function RoleAssignment() {
  const [roles, setRoles] = useState<Role[]>([
    { id: '1', name: '主持人', type: 'ai' },
    { id: '2', name: '玩家1', type: 'human' },
    { id: '3', name: '玩家2', type: 'ai' },
  ]);

  const handleTypeChange = (roleId: string, type: 'human' | 'ai') => {
    setRoles(roles.map(role => 
      role.id === roleId ? { ...role, type } : role
    ));
  };

  return (
    <div className="role-assignment">
      <div className="role-list">
        {roles.map(role => (
          <div key={role.id} className="role-item">
            <div className="role-info">
              <h3>{role.name}</h3>
              <div className="role-type-selector">
                <button
                  className={`type-button ${role.type === 'human' ? 'active' : ''}`}
                  onClick={() => handleTypeChange(role.id, 'human')}
                >
                  人类玩家
                </button>
                <button
                  className={`type-button ${role.type === 'ai' ? 'active' : ''}`}
                  onClick={() => handleTypeChange(role.id, 'ai')}
                >
                  AI玩家
                </button>
              </div>
            </div>
            {role.type === 'ai' && (
              <div className="role-config">
                <p className="config-tip">请在"AI角色配置"标签页中配置此角色</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="role-actions">
        <button className="btn-primary">
          保存配置
        </button>
      </div>
    </div>
  );
} 