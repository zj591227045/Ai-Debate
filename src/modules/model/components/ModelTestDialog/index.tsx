import React, { useState, useRef, useEffect } from 'react';
import type { ModelConfig } from '../../types/config';
import { Message, StreamResponse } from '../../../llm/types/common';
import { useModelTest } from '../../hooks/useModelTest';
import './styles.css';

interface ModelTestDialogProps {
  modelConfig: ModelConfig;
  onClose: () => void;
  systemPrompt?: string;
  placeholder?: string;
  maxInputLength?: number;
  showReasoning?: boolean;
  showTimestamp?: boolean;
}

export const ModelTestDialog: React.FC<ModelTestDialogProps> = ({
  modelConfig: model,
  onClose,
  systemPrompt = '你是一个有帮助的AI助手。',
  placeholder = '输入消息...',
  maxInputLength = 2000,
  showReasoning = true,
  showTimestamp = true
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [currentResponse, setCurrentResponse] = useState<Message | null>(null);
  const [currentReasoning, setCurrentReasoning] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    sendMessage,
    isLoading,
    testStream
  } = useModelTest({
    modelConfig: model,
    onStreamOutput: (response: StreamResponse) => {
      console.log('LLM Service Stream Chunk:', response);
      
      // 更新响应内容和推理内容
      setCurrentResponse(prev => {
        const newContent = response.content ? (prev?.content || '') + response.content : (prev?.content || '');
        const newReasoning = response.metadata?.reasoning 
          ? (prev?.reasoning_content || '') + response.metadata.reasoning 
          : (prev?.reasoning_content || '');

        return {
          role: 'assistant',
          content: newContent,
          reasoning_content: newReasoning,
          timestamp: Date.now()
        };
      });
    },
    onError: (error: Error) => {
      console.error('LLM Service Error:', error);
      setError(error);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  const handleSubmit = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage = userInput.trim();
    console.group('=== LLM Service Request ===');
    console.log('Input Message:', userMessage);
    console.log('Current Messages:', messages);
    console.groupEnd();

    setUserInput('');
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp: Date.now()
    }]);

    setCurrentResponse(null);
    setError(null);

    try {
      await testStream(userMessage, systemPrompt);
      
      // 在流式响应完成后，将当前响应添加到消息列表
      if (currentResponse) {
        setMessages(prev => [...prev, currentResponse]);
      }
    } catch (err) {
      console.error('发送消息失败:', err);
      setError(err instanceof Error ? err : new Error('发送消息失败'));
    }
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderMessage = (message: Message, index: number) => (
    <div key={index} className={`message ${message.role}`}>
      <div className="message-header">
        <span className="role">{message.role === 'user' ? '用户' : 'AI'}</span>
        {showTimestamp && message.timestamp && (
          <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
        )}
      </div>
      
      {showReasoning && message.role === 'assistant' && message.reasoning_content && (
        <div className="reasoning-content">
          <div className="reasoning-header">思考过程：</div>
          <div className="reasoning-text">{message.reasoning_content}</div>
        </div>
      )}
      
      <div className="message-content">{message.content}</div>
    </div>
  );

  return (
    <div className="model-test-dialog">
      <div className="dialog-header">
        <h3>模型测试 - {model.name}</h3>
        <button onClick={onClose}>关闭</button>
      </div>

      <div className="messages-container">
        {messages.map(renderMessage)}
        {currentResponse && renderMessage(currentResponse, messages.length)}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="error-message">
          {error.message}
        </div>
      )}

      <div className="input-container">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={placeholder}
          maxLength={maxInputLength}
          disabled={isLoading}
        />
        <button 
          onClick={handleSubmit}
          disabled={isLoading || !userInput.trim()}
        >
          {isLoading ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
};

export default ModelTestDialog; 