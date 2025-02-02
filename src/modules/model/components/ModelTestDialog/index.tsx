import React, { useState, useRef, useEffect } from 'react';
import { ModelConfig } from '../../types';
import { providerFactory } from '../../services/providerFactory';
import '../ModelTestDialog/styles.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  reasoning_content?: string;
}

interface ModelTestDialogProps {
  model: ModelConfig;
  onClose: () => void;
}

export default function ModelTestDialog({ model, onClose }: ModelTestDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('接收到的模型配置:', {
      provider: model.provider,
      model: model.model,
      parameters: model.parameters,
      auth: {
        ...model.auth,
        apiKey: '***'
      }
    });
  }, [model]);

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
      const providerSpecific: any = {};
      
      if (model.provider === 'ollama') {
        providerSpecific.ollama = {
          baseUrl: model.auth.baseUrl || 'http://localhost:11434',
          model: model.model,
        };
      } else if (model.provider === 'deepseek') {
        providerSpecific.deepseek = {
          model: model.model,
          options: {
            temperature: model.parameters.temperature,
            top_p: model.parameters.topP,
            max_tokens: model.parameters.maxTokens,
          }
        };
        console.log('Deepseek 配置:', {
          provider: model.provider,
          model: model.model,
          providerSpecific
        });
      } else {
        providerSpecific[model.provider] = {
          ...model.providerSpecific?.[model.provider],
          model: model.model,
        };
      }

      console.log('创建 provider 前的配置:', {
        provider: model.provider,
        endpoint: model.auth.baseUrl,
        providerSpecific
      });

      const provider = await providerFactory.createProvider(model.provider, {
        endpoint: model.auth.baseUrl || '',
        apiKey: model.auth.apiKey || '',
        organizationId: model.auth.organizationId || '',
        providerSpecific
      });

      // 使用流式输出
      const stream = provider.generateCompletionStream(
        [...messages, { role: 'user', content: message }],
        model.parameters
      );

      let responseContent = '';
      let reasoningContent = '';

      for await (const chunk of stream) {
        // 如果是 deepseek-reasoner 模型，处理思考过程
        if (model.provider === 'deepseek' && model.model === 'deepseek-reasoner') {
          if ((chunk as any).delta?.content) {
            responseContent += (chunk as any).delta.content;
          }
          if ((chunk as any).delta?.reasoning_content) {
            reasoningContent += (chunk as any).delta.reasoning_content;
          }
        } else {
          if (chunk.content) {
            responseContent += chunk.content;
          }
        }

        if (responseContent || reasoningContent) {
          setCurrentResponse({
            role: 'assistant',
            content: responseContent,
            ...(reasoningContent && { reasoning_content: reasoningContent })
          });
        }
      }

      // 流式输出完成后，添加到消息列表
      if (responseContent) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: responseContent,
          ...(reasoningContent && { reasoning_content: reasoningContent })
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
      <div className="message-content">
        {message.reasoning_content && (
          <div className="reasoning-content">
            <div className="reasoning-header">思考过程：</div>
            {message.reasoning_content}
          </div>
        )}
        {message.content}
      </div>
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