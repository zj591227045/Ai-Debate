import React, { useState } from 'react';
import type { PlayerConfig } from '@debate-flow/types/interfaces';

interface DebatePlayerProps {
  config: PlayerConfig;
  isCurrentSpeaker: boolean;
  onSubmitSpeech: (content: string) => Promise<void>;
}

export const DebatePlayer: React.FC<DebatePlayerProps> = ({
  config,
  isCurrentSpeaker,
  onSubmitSpeech
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    try {
      setIsSubmitting(true);
      await onSubmitSpeech(content);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`debate-player ${isCurrentSpeaker ? 'current' : ''}`}>
      <div className="player-info">
        <h3>{config.name}</h3>
        <div className="player-role">
          {config.team} - {config.role}
        </div>
      </div>

      {isCurrentSpeaker && !config.isAI && (
        <div className="speech-input">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="请输入发言内容..."
            disabled={isSubmitting}
          />
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? '提交中...' : '提交发言'}
          </button>
        </div>
      )}

      {isCurrentSpeaker && config.isAI && (
        <div className="ai-speaking">
          AI正在生成发言...
        </div>
      )}
    </div>
  );
}; 