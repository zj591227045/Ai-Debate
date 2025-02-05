import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import type { UnifiedPlayer, Speech } from '../../types/adapters';
import { AIDebateService } from '../../modules/debate/services/AIDebateService';
import { Character } from '../../modules/debate/types/character';
import { DebateState } from '../../modules/debate/types/debate';
import { convertToISOString } from '../../utils/timestamp';

const Container = styled.div`
  padding: 16px;
  background: var(--color-bg-white);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
`;

const Section = styled.div`
  margin-bottom: 16px;
`;

const Title = styled.h3`
  margin: 0 0 8px;
  color: var(--color-text-primary);
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: ${props => 
    props.variant === 'primary' ? 'var(--color-primary)' :
    props.variant === 'danger' ? 'var(--color-error)' :
    'var(--color-bg-light)'
  };
  color: ${props => 
    props.variant ? 'white' : 'var(--color-text-primary)'
  };
  cursor: pointer;
  margin-right: 8px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Status = styled.div<{ type: 'success' | 'error' | 'info' }>`
  padding: 8px;
  margin-top: 8px;
  border-radius: 4px;
  background: ${props =>
    props.type === 'success' ? 'var(--color-success-light)' :
    props.type === 'error' ? 'var(--color-error-light)' :
    'var(--color-bg-light)'
  };
  color: ${props =>
    props.type === 'success' ? 'var(--color-success)' :
    props.type === 'error' ? 'var(--color-error)' :
    'var(--color-text-secondary)'
  };
`;

const Output = styled.pre`
  padding: 12px;
  background: var(--color-bg-light);
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 8px 0;
`;

interface AITestPanelProps {
  player: UnifiedPlayer;
  context: {
    topic: {
      title: string;
      background: string;
    };
    currentRound: number;
    totalRounds: number;
    previousSpeeches: Speech[];
  };
  onGenerateSuccess?: (type: 'thoughts' | 'speech', content: string) => void;
  onError?: (error: Error) => void;
}

export const AITestPanel: React.FC<AITestPanelProps> = ({
  player,
  context,
  onGenerateSuccess,
  onError
}) => {
  // 状态管理
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTask, setCurrentTask] = useState<'thoughts' | 'speech' | null>(null);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);

  // 创建AI服务实例
  const aiService = new AIDebateService();

  // 转换 UnifiedPlayer 到 Character
  const convertToCharacter = (player: UnifiedPlayer): Character => {
    console.log('转换角色配置:', {
      characterId: player.characterId,
      modelId: player.modelId,
      name: player.name
    });
    
    return {
      id: player.characterId || '', // 使用characterId作为AI角色的ID
      name: player.name,
      isAI: player.isAI,
      role: 'debater',  // 在测试面板中默认为辩手
      config: {
        modelId: player.modelId || '6787386d-12d1-4db9-90c3-973576c23a84' // 使用默认的模型ID
      },
      personality: player.personality,
      speakingStyle: player.speakingStyle,
      background: player.background,
      values: player.values ? [player.values] : undefined,
      argumentationStyle: player.argumentationStyle ? [player.argumentationStyle] : undefined
    };
  };

  // 转换上下文到 DebateState
  const convertToDebateState = (context: AITestPanelProps['context']): DebateState => ({
    topic: {
      title: context.topic.title,
      background: context.topic.background
    },
    currentRound: context.currentRound,
    totalRounds: context.totalRounds,
    speeches: context.previousSpeeches.map(speech => ({
      ...speech,
      timestamp: typeof speech.timestamp === 'number' 
        ? convertToISOString(speech.timestamp)
        : speech.timestamp
    })),
    status: 'ongoing',
    players: [],
    scores: [],
    innerThoughts: {}
  });

  // 生成内心OS
  const generateThoughts = useCallback(async () => {
    setIsGenerating(true);
    setCurrentTask('thoughts');
    setError(null);
    
    try {
      const character = convertToCharacter(player);
      const debateState = convertToDebateState(context);
      const thoughts = await aiService.generateInnerThoughts(character, debateState);
      
      setOutput(thoughts);
      onGenerateSuccess?.('thoughts', thoughts);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setIsGenerating(false);
      setCurrentTask(null);
    }
  }, [player, context, aiService, onGenerateSuccess, onError]);

  // 生成发言
  const generateSpeech = useCallback(async () => {
    setIsGenerating(true);
    setCurrentTask('speech');
    setError(null);
    
    try {
      const character = convertToCharacter(player);
      const debateState = convertToDebateState(context);
      const speech = await aiService.generateSpeech(character, debateState, output);
      
      setOutput(speech);
      onGenerateSuccess?.('speech', speech);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setIsGenerating(false);
      setCurrentTask(null);
    }
  }, [player, context, output, aiService, onGenerateSuccess, onError]);

  // 取消生成 - 由于 AIDebateService 不支持取消，我们只更新UI状态
  const cancelGeneration = useCallback(() => {
    setIsGenerating(false);
    setCurrentTask(null);
  }, []);

  return (
    <Container>
      <Section>
        <Title>AI测试面板</Title>
        <div>
          <Button
            variant="primary"
            onClick={generateThoughts}
            disabled={isGenerating}
          >
            生成内心OS
          </Button>
          <Button
            variant="primary"
            onClick={generateSpeech}
            disabled={isGenerating || !output}
          >
            生成发言
          </Button>
          {isGenerating && (
            <Button
              variant="danger"
              onClick={cancelGeneration}
            >
              取消生成
            </Button>
          )}
        </div>

        {isGenerating && (
          <Status type="info">
            正在生成{currentTask === 'thoughts' ? '内心OS' : '发言'}...
          </Status>
        )}

        {error && (
          <Status type="error">
            生成失败: {error.message}
          </Status>
        )}

        {output && !error && (
          <>
            <Status type="success">
              生成成功
            </Status>
            <Output>{output}</Output>
          </>
        )}
      </Section>
    </Container>
  );
}; 