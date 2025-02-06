import React, { useState, useRef, useEffect } from 'react';
import { ModelConfig } from '../../types';
import { useModelTest } from '../../../llm/hooks/useModelTest';
import { adaptModelConfig } from '../../../llm/utils/adapters';
import '../ModelTestDialog/styles.css';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning_content?: string;
  timestamp?: number;
}

interface ModelTestDialogProps {
  model: ModelConfig;
  onClose: () => void;
  systemPrompt?: string;
  placeholder?: string;
  maxInputLength?: number;
  showReasoning?: boolean;
  showTimestamp?: boolean;
}

export default function ModelTestDialog({ 
  model, 
  onClose,
  systemPrompt = '你是一个有帮助的AI助手。',
  placeholder = '输入消息...',
  maxInputLength = 2000,
  showReasoning = false,
  showTimestamp = true
}: ModelTestDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentResponse, setCurrentResponse] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 适配模型配置
  const adaptedConfig = adaptModelConfig(model);

  // 添加调试信息
  console.group('=== LLM Service Debug Info ===');
  console.log('Original Model Config:', model);
  console.log('Adapted Model Config:', adaptedConfig);
  console.groupEnd();

  // 使用测试Hook
  const {
    loading: isLoading,
    error,
    testStream
  } = useModelTest({
    modelConfig: adaptedConfig,
    onStreamOutput: (chunk: string, isReasoning?: boolean) => {
      console.log('LLM Service Stream Chunk:', chunk, isReasoning ? '(reasoning)' : '');
      setCurrentResponse(prev => ({
        role: 'assistant',
        content: isReasoning ? prev?.content || '' : (prev ? prev.content + chunk : chunk),
        reasoning_content: isReasoning ? (prev?.reasoning_content || '') + chunk : prev?.reasoning_content,
        timestamp: Date.now()
      }));
    },
    onError: (error: Error) => {
      console.error('LLM Service Error:', error);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    console.group('=== LLM Service Request ===');
    console.log('Input Message:', userMessage);
    console.log('Current Messages:', messages);
    console.groupEnd();

    setInput('');
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp: Date.now()
    }]);
    setCurrentResponse(null);

    try {
      // 构建系统提示词
      const prompt = messages.length === 0 ? systemPrompt : messages
        .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      console.log('LLM Service System Prompt:', prompt);
      await testStream(userMessage, prompt);

      // 流式输出完成后，添加到消息列表
      if (currentResponse) {
        console.log('LLM Service Complete Response:', currentResponse);
        setMessages(prev => [...prev, currentResponse]);
      }
    } catch (err) {
      console.error('LLM Service Error:', err);
    }
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const renderMessage = (message: Message, index: number) => (
    <div
      key={index}
      className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
    >
      <div className="message-content">
        {message.reasoning_content && (
          <div className="reasoning-content">
            <div className="reasoning-header">思考过程：</div>
            {message.reasoning_content}
          </div>
        )}
        {message.content}
        {showTimestamp && message.timestamp && (
          <div className="message-timestamp">
            {formatTimestamp(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="model-test-dialog">
      <div className="dialog-header">
        <h2>测试对话 - {model.name || model.model}</h2>
        <div className="dialog-header-info">
          <span className="model-info">
            {model.provider} / {model.model}
          </span>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="message system">
            <div className="message-content">
              <div className="system-prompt">
                系统提示词：{systemPrompt}
              </div>
            </div>
          </div>
        )}
        {messages.map((message, index) => renderMessage(message, index))}
        {currentResponse && renderMessage(currentResponse, messages.length)}
        {error && (
          <div className="message system error">
            <div className="message-content">
              <span className="error-icon">⚠️</span>
              {error.message}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="input-container" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          maxLength={maxInputLength}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? '发送中...' : '发送'}
        </button>
      </form>
    </div>
  );
} 