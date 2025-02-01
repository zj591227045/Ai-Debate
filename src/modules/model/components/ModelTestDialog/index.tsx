import React, { useState, useRef, useEffect } from 'react';
import { ModelConfig } from '../../types';
import './styles.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ModelTestDialogProps {
  model: ModelConfig;
  onClose: () => void;
}

export default function ModelTestDialog({ model, onClose }: ModelTestDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${model.auth.apiKey}`,
        },
        body: JSON.stringify({
          model: model.model,
          messages: [...messages, userMessage],
          ...model.parameters,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              assistantMessage += content;
              
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = assistantMessage;
                return newMessages;
              });
            } catch (e) {
              console.error('Error parsing SSE message:', e);
            }
          }
        }
      }
    } catch (err) {
      setError((err as Error).message);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="model-test-dialog">
      <div className="dialog-header">
        <h2>测试对话 - {model.name}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            <div className="message-content">{message.content}</div>
          </div>
        ))}
        {error && <div className="error-message">错误: {error}</div>}
        <div ref={messagesEndRef} />
      </div>

      <form className="input-container" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="输入消息..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !inputValue.trim()}>
          {isLoading ? '发送中...' : '发送'}
        </button>
      </form>
    </div>
  );
} 