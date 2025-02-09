import React, { useState } from 'react';
import styled from '@emotion/styled';
import type { UnifiedPlayer, Speech } from '../../types/adapters';
import { useModelTest } from '../../modules/llm/hooks/useModelTest';
import { adaptModelConfig } from '../../modules/llm/utils/adapters';
import { useModel } from '../../modules/model/context/ModelContext';
import { convertToISOString } from '../../utils/timestamp';

interface AITestPanelProps {
  player: UnifiedPlayer;
  context?: {
    topic: {
      title: string;
      background: string;
    };
    currentRound: number;
    totalRounds: number;
    previousSpeeches: Speech[];
  };
  onSpeechGenerated?: (speech: Speech) => void;
  onError?: (error: Error) => void;
}

export const AITestPanel: React.FC<AITestPanelProps> = ({ 
  player, 
  context,
  onSpeechGenerated, 
  onError 
}) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const { state } = useModel();
  
  const modelConfig = state.models.find(m => m.id === player.modelId);
  if (!modelConfig) {
    return <div>未找到模型配置</div>;
  }

  // 构建系统提示词
  const buildSystemPrompt = () => {
    if (!context) return '';

    const parts = [
      `当前辩论主题：${context.topic.title}`,
      `背景信息：${context.topic.background}`,
      `当前是第 ${context.currentRound}/${context.totalRounds} 轮辩论`
    ];

    if (context.previousSpeeches.length > 0) {
      parts.push('历史发言：\n' + context.previousSpeeches
        .map(speech => `[${speech.timestamp}] ${speech.content}`)
        .join('\n')
      );
    }

    return parts.join('\n\n');
  };

  const { loading, error, testStream } = useModelTest({
    modelConfig: adaptModelConfig(modelConfig),
    onStreamOutput: (response) => {
      setOutput(prev => [...prev, response.content]);
      if (onSpeechGenerated) {
        onSpeechGenerated({
          id: crypto.randomUUID(),
          playerId: player.id,
          content: response.content,
          timestamp: convertToISOString(Date.now()),
          round: context?.currentRound || 1,
          references: []
        });
      }
    },
    onError: (error) => {
      setOutput(prev => [...prev, `错误: ${error.message}`]);
      if (onError) {
        onError(error);
      }
    }
  });

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    
    setOutput([]);
    await testStream(input.trim(), buildSystemPrompt());
  };

  return (
    <Container>
      <Header>
        <Title>{player.name} 测试面板</Title>
      </Header>
      
      <Content>
        <InputSection>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入测试内容..."
            disabled={loading}
          />
          <Button 
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
          >
            {loading ? '生成中...' : '发送'}
          </Button>
        </InputSection>

        <OutputSection>
          {output.map((text, index) => (
            <OutputLine key={index}>
              {text}
            </OutputLine>
          ))}
          {error && (
            <ErrorMessage>
              {error.message}
            </ErrorMessage>
          )}
        </OutputSection>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin: 16px;
  background: white;
`;

const Header = styled.div`
  margin-bottom: 16px;
`;

const Title = styled.h3`
  margin: 0;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InputSection = styled.div`
  display: flex;
  gap: 8px;
`;

const TextArea = styled.textarea`
  flex: 1;
  min-height: 100px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
`;

const Button = styled.button`
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:disabled {
    background: #d9d9d9;
    cursor: not-allowed;
  }
`;

const OutputSection = styled.div`
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 16px;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
`;

const OutputLine = styled.div`
  margin-bottom: 8px;
  white-space: pre-wrap;
`;

const ErrorMessage = styled.div`
  color: #ff4d4f;
  margin-top: 8px;
`;

export default AITestPanel; 