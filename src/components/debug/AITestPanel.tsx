import React from 'react';
import styled from '@emotion/styled';
import { Button, Input } from 'antd';
import type { UnifiedPlayer, Speech } from '../../types/adapters';

const { TextArea } = Input;

const Container = styled.div`
  padding: 16px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  margin-top: 16px;
`;

const Title = styled.h4`
  color: #1890ff;
  margin: 0 0 12px 0;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

interface AITestPanelProps {
  player: UnifiedPlayer;
  context: {
    topic: {
      title: string;
      description: string;
    };
    currentRound: number;
    totalRounds: number;
    previousSpeeches: Speech[];
  };
  onSpeechGenerated: (speech: Speech) => void;
  onError: (error: Error) => void;
}

export const AITestPanel: React.FC<AITestPanelProps> = ({
  player,
  context,
  onSpeechGenerated,
  onError
}) => {
  const [content, setContent] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      
      // 模拟生成发言
      const speech: Speech = {
        id: Date.now().toString(),
        playerId: player.id,
        content,
        round: context.currentRound,
        timestamp: new Date().toISOString(),
        references: []
      };

      onSpeechGenerated(speech);
      setContent('');
    } catch (error) {
      onError(error as Error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Container>
      <Title>AI发言测试面板</Title>
      
      <div>
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: '#1890ff' }}>当前轮次：</span>
          <span style={{ color: '#fff' }}>{context.currentRound}/{context.totalRounds}</span>
        </div>
        
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: '#1890ff' }}>辩题：</span>
          <span style={{ color: '#fff' }}>{context.topic.title}</span>
        </div>
        
        <div style={{ marginBottom: 12 }}>
          <span style={{ color: '#1890ff' }}>背景：</span>
          <span style={{ color: '#fff' }}>{context.topic.description}</span>
        </div>
      </div>

      <TextArea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="在此输入测试发言内容..."
        autoSize={{ minRows: 3, maxRows: 6 }}
        style={{ marginBottom: 12 }}
      />

      <Actions>
        <Button
          type="primary"
          onClick={handleGenerate}
          loading={isGenerating}
          disabled={!content.trim()}
        >
          生成发言
        </Button>
        <Button onClick={() => setContent('')}>
          清空
        </Button>
      </Actions>
    </Container>
  );
}; 