import React from 'react';
import { List, Card, Button } from 'antd';
import { CharacterConfig } from '../../types';
import { CharacterTemplate } from '../../types/template';
import './styles.css';

export interface TemplateSelectorProps {
  templates: CharacterTemplate[];
  onSelect: (template: Partial<CharacterConfig>) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ templates, onSelect }) => {
  return (
    <List
      grid={{ gutter: 16, column: 2 }}
      dataSource={templates}
      renderItem={(template) => (
        <List.Item>
          <Card
            title={template.name}
            extra={
              <Button type="primary" size="small" onClick={() => onSelect(template)}>
                使用
              </Button>
            }
            hoverable
          >
            <p className="template-description">{template.description}</p>
            <div className="template-tags">
              {template.persona.personality.map((tag) => (
                <span key={tag} className="template-tag">
                  {tag}
                </span>
              ))}
            </div>
          </Card>
        </List.Item>
      )}
    />
  );
};

export { TemplateSelector };