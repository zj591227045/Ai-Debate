import React, { useState, useCallback } from 'react';
import { useDebateService } from '../../hooks/useDebateService';
import { Debater, DebateContext, Speech } from '../../types';
import './styles.css';

interface DebatePlayerProps {
  debater: Debater;
  context: DebateContext;
  onSpeechGenerated?: (speech: Speech) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export const DebatePlayer: React.FC<DebatePlayerProps> = ({
  debater,
  context,
  onSpeechGenerated,
  onError,
  className
}) => {
  const [currentSpeech, setCurrentSpeech] = useState<Speech>({
    id: '',
    playerId: '',
    content: '',
    reasoningContent: '',
    timestamp: '',
    round: 0,
    role: 'assistant',
    type: 'speech'
  });
  const [isThinking, setIsThinking] = useState(false);

  // 使用辩论服务
  const {
    loading,
    error,
    generateSpeechStream
  } = useDebateService({
    debater,
    context,
    onStreamOutput: (chunk, isReasoning) => {
      setCurrentSpeech(prev => {
        if (isReasoning) {
          return {
            ...prev,
            reasoningContent: ((prev.reasoningContent || '') + chunk)
          };
        } else {
          return {
            ...prev,
            content: (prev.content || '') + chunk
          };
        }
      });
    },
    onError
  });

  // 生成发言
  const handleGenerateSpeech = useCallback(async () => {
    setIsThinking(true);
    const newSpeechId = crypto.randomUUID();
    
    setCurrentSpeech({
      id: newSpeechId,
      playerId: debater.id,
      content: '',
      reasoningContent: '',
      timestamp: new Date().toISOString(),
      round: context.currentRound,
      role: 'assistant',
      type: 'speech'
    });

    try {
      await generateSpeechStream();
      
      // 发言完成后，通知父组件
      if (currentSpeech.content) {
        onSpeechGenerated?.({
          ...currentSpeech,
          id: currentSpeech.id || newSpeechId,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setIsThinking(false);
    }
  }, [debater, context, generateSpeechStream, currentSpeech, onSpeechGenerated]);

  return (
    <div className={`debate-player ${className || ''}`}>
      <div className="player-info">
        <h3>{debater.name}</h3>
        <div className="player-model">
          使用模型: {debater.modelConfig.name || debater.modelConfig.model}
        </div>
      </div>

      {/* 思考过程 */}
      {currentSpeech.reasoningContent && (
        <div className="player-thinking">
          <div className="thinking-header">
            <span className="thinking-icon">💭</span>
            思考过程
          </div>
          <div className="thinking-content">
            {currentSpeech.reasoningContent}
          </div>
        </div>
      )}

      {/* 发言内容 */}
      {currentSpeech.content && (
        <div className="player-speech">
          <div className="speech-content">
            {currentSpeech.content}
          </div>
          <div className="speech-timestamp">
            {typeof currentSpeech.timestamp === 'string' 
              ? new Date(currentSpeech.timestamp).toLocaleTimeString()
              : new Date(currentSpeech.timestamp).toLocaleTimeString()
            }
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="player-error">
          发生错误: {error.message}
        </div>
      )}

      {/* 控制按钮 */}
      <div className="player-controls">
        <button
          className="generate-button"
          onClick={handleGenerateSpeech}
          disabled={loading || isThinking}
        >
          {loading || isThinking ? '思考中...' : '生成发言'}
        </button>
      </div>
    </div>
  );
}; 