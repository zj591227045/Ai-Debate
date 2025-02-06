import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import type { UnifiedPlayer, Speech } from '../../types/adapters';
import { useModelTest } from '../../modules/llm/hooks/useModelTest';
import { adaptModelConfig } from '../../modules/llm/utils/adapters';
import { useModel } from '../../modules/model/context/ModelContext';
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
  onGenerateSuccess?: (content: string) => void;
  onError?: (error: Error) => void;
}

export const AITestPanel: React.FC<AITestPanelProps> = ({
  player,
  context,
  onGenerateSuccess,
  onError
}) => {
  const [output, setOutput] = useState<string>('');
  const { state: modelState } = useModel();

  // 获取模型配置
  const modelConfig = modelState.models.find(m => m.id === player.modelId);
  if (!modelConfig) {
    return (
      <Container>
        <Status type="error">
          未找到模型配置 (ID: {player.modelId})
        </Status>
      </Container>
    );
  }

  // 使用测试Hook
  const {
    loading: isGenerating,
    error,
    testStream
  } = useModelTest({
    modelConfig: adaptModelConfig(modelConfig),
    context: {
      topic: context.topic,
      currentRound: context.currentRound,
      totalRounds: context.totalRounds,
      previousSpeeches: context.previousSpeeches.map(speech => ({
        ...speech,
        timestamp: typeof speech.timestamp === 'number' 
          ? convertToISOString(speech.timestamp)
          : speech.timestamp
      }))
    },
    onStreamOutput: (chunk: string) => {
      setOutput(prev => prev + chunk);
    },
    onError
  });

  // 生成内心OS
  const generateThoughts = useCallback(async () => {
    setOutput('');
    
    const prompt = `
你现在扮演一个辩论选手，需要针对当前的辩论主题和场景，生成内心的思考过程。

角色信息：
姓名：${player.name}
背景：${player.background || '未指定'}
性格：${player.personality || '未指定'}
说话风格：${player.speakingStyle || '未指定'}
价值观：${player.values || '未指定'}
论证风格：${player.argumentationStyle || '未指定'}

请基于以上信息，结合当前辩论主题和进展，生成一段内心独白，展现你的思考过程。
`.trim();

    try {
      await testStream('', prompt);
      if (output) {
        onGenerateSuccess?.(output);
      }
    } catch (err) {
      console.error('生成内心OS失败:', err);
    }
  }, [player, testStream, output, onGenerateSuccess]);

  // 生成发言
  const generateSpeech = useCallback(async () => {
    if (!output) return;
    
    const prompt = `
你现在扮演一个辩论选手，需要基于之前的思考，生成一段正式的辩论发言。

角色信息：
姓名：${player.name}
背景：${player.background || '未指定'}
性格：${player.personality || '未指定'}
说话风格：${player.speakingStyle || '未指定'}
价值观：${player.values || '未指定'}
论证风格：${player.argumentationStyle || '未指定'}

你之前的思考过程是：
${output}

请基于以上信息，生成一段正式的辩论发言。
`.trim();

    try {
      await testStream('', prompt);
      if (output) {
        onGenerateSuccess?.(output);
      }
    } catch (err) {
      console.error('生成发言失败:', err);
    }
  }, [player, output, testStream, onGenerateSuccess]);

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
        </div>

        {isGenerating && (
          <Status type="info">
            正在生成...
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