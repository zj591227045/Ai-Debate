import React, { useState } from 'react';
import type { ModelConfig } from '../modules/model/types';
import { LLMService } from '../modules/llm/services/LLMService';
import './ModelTestDialog.css';

interface ModelTestDialogProps {
  modelConfig: ModelConfig;
  onClose: () => void;
}

export const ModelTestDialog: React.FC<ModelTestDialogProps> = ({ modelConfig, onClose }) => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!message.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const llmService = LLMService.getInstance();
      
      // 初始化模型
      await llmService.testModel(modelConfig);
      
      // 发送测试消息
      const response = await llmService.chat({
        message: message.trim(),
        systemPrompt: '你是一个有帮助的AI助手。',
        temperature: modelConfig.parameters.temperature,
        maxTokens: modelConfig.parameters.maxTokens,
        topP: modelConfig.parameters.topP,
        model: `${modelConfig.provider}:${modelConfig.model}:${modelConfig.auth.baseUrl}`
      });
      
      setResponse(response.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : '测试失败');
      console.error('测试失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="model-test-dialog">
      <div className="dialog-header">
        <h3>模型测试 - {modelConfig.name}</h3>
        <button onClick={onClose}>关闭</button>
      </div>
      
      <div className="dialog-content">
        <div className="input-section">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="输入测试消息..."
            disabled={loading}
          />
          <button 
            onClick={handleTest}
            disabled={loading || !message.trim()}
          >
            {loading ? '测试中...' : '发送'}
          </button>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {response && (
          <div className="response-section">
            <h4>响应结果：</h4>
            <div className="response-content">
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 