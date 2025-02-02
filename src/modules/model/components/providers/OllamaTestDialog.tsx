import React, { useState, useRef, useEffect } from 'react';
import { ModelConfig } from '../../types';
import { providerFactory } from '../../services/providerFactory';
import '../ModelTestDialog/styles.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface OllamaTestDialogProps {
  model: ModelConfig;
  onClose: () => void;
}

export function OllamaTestDialog({ model, onClose }: OllamaTestDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const message = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);
    setError(null);
    setCurrentResponse(null);

    try {
      const provider = await providerFactory.createProvider('ollama', {
        endpoint: model.auth.baseUrl || 'http://localhost:11434',
        apiKey: '',  // Ollama 不需要 API key
        organizationId: '',  // Ollama 不需要 organization ID
        providerSpecific: {
          ollama: {
            model: model.model,  // 使用配置中指定的模型名称
            options: {
              temperature: model.parameters.temperature,
              top_p: model.parameters.topP,
              num_predict: model.parameters.maxTokens,
            }
          }
        }
      });

      // 使用流式输出
      const stream = provider.generateCompletionStream(
        [...messages, { role: 'user', content: message }],
        model.parameters
      );

      let responseContent = '';

      for await (const chunk of stream) {
        if (chunk.content) {
          responseContent += chunk.content;
          setCurrentResponse({
            role: 'assistant',
            content: responseContent
          });
        }
      }

      // 流式输出完成后，添加到消息列表
      if (responseContent) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: responseContent
        }]);
      }
    } catch (error) {
      console.error('生成回复失败:', error);
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
      setCurrentResponse(null);
    }
  };

  const renderMessage = (message: Message, index: number) => (
    <div
      key={index}
      className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
    >
      <div className="message-content">{message.content}</div>
    </div>
  );

  return (
    <div className="model-test-dialog">
      <div className="dialog-header">
        <h2>测试对话 - {model.name}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="messages-container">
        {messages.map((message, index) => renderMessage(message, index))}
        {currentResponse && renderMessage(currentResponse, messages.length)}
        {error && (
          <div className="message system error">
            <div className="message-content">
              <span className="error-icon">⚠️</span>
              {error}
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
          placeholder="输入消息..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? '发送中...' : '发送'}
        </button>
      </form>
    </div>
  );
} 