import React from 'react';
import { RobotOutlined, CloudOutlined, ApiOutlined } from '@ant-design/icons';
import './styles.css';

interface Provider {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface ProviderSelectProps {
  value?: string;
  onChange: (value: string) => void;
}

const providers: Provider[] = [
  {
    id: 'ollama',
    name: 'Ollama',
    description: '本地运行的开源 LLM 服务',
    icon: <RobotOutlined />
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '智谱 AI 提供的大语言模型服务',
    icon: <CloudOutlined />
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    description: '高性能的 AI 推理服务',
    icon: <ApiOutlined />
  }
];

export const ProviderSelect: React.FC<ProviderSelectProps> = ({ value, onChange }) => {
  return (
    <div className="provider-grid">
      {providers.map((provider) => (
        <div
          key={provider.id}
          className={`provider-card ${value === provider.id ? 'selected' : ''}`}
          onClick={() => onChange(provider.id)}
        >
          <div className="provider-icon">{provider.icon}</div>
          <div className="provider-info">
            <h3 className="provider-name">{provider.name}</h3>
            <p className="provider-description">{provider.description}</p>
          </div>
          {value === provider.id && (
            <div className="provider-selected">✓</div>
          )}
        </div>
      ))}
    </div>
  );
}; 