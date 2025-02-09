import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import type { UnifiedPlayer, Speech } from '../../types/adapters';
import { useModelTest } from '../../modules/llm/hooks/useModelTest';
import { adaptModelConfig } from '../../modules/llm/utils/adapters';
import { useModel } from '../../modules/model/context/ModelContext';
import type { ModelConfig } from '../../modules/model/types';
import { getStateManager } from '../../store/unified';
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
  const { state: modelState } = useModel();
  const stateManager = getStateManager();
  const unifiedState = stateManager?.getState();
  
  // 添加调试日志
  useEffect(() => {
    console.group('=== AITestPanel Debug Info ===');
    console.log('Player:', {
      id: player.id,
      name: player.name,
      characterId: player.characterId,
      isAI: player.isAI
    });
    console.log('Unified State:', {
      hasCharacters: !!unifiedState?.characters,
      totalCharacters: Object.keys(unifiedState?.characters.byId || {}).length,
      characterIds: Object.keys(unifiedState?.characters.byId || {})
    });
    console.groupEnd();
  }, [player, unifiedState]);

  // 从 unifiedState 获取角色信息
  const character = player.characterId ? unifiedState?.characters.byId[player.characterId] : undefined;
  
  // 添加角色查找结果日志
  console.log('Character lookup result:', {
    searchingForId: player.characterId,
    found: !!character,
    characterDetails: character ? {
      id: character.id,
      name: character.name,
      hasCallConfig: !!character.callConfig
    } : undefined
  });

  if (!character) {
    // 添加更详细的错误信息
    console.error('未找到角色信息:', {
      searchedId: player.characterId,
      availableIds: Object.keys(unifiedState?.characters.byId || {}),
      player: player,
      unifiedStateSnapshot: {
        hasCharacters: !!unifiedState?.characters,
        charactersCount: Object.keys(unifiedState?.characters.byId || {}).length
      }
    });
    return (
      <ErrorContainer>
        <ErrorMessage>
          未找到角色信息
          <ErrorDetail>
            角色ID: {player.characterId}
          </ErrorDetail>
          <ErrorDetail>
            可用角色: {Object.keys(unifiedState?.characters.byId || {}).join(', ')}
          </ErrorDetail>
        </ErrorMessage>
      </ErrorContainer>
    );
  }

  // 获取模型配置
  let modelConfig: ModelConfig | null = null;
  if (character.callConfig?.type === 'direct' && character.callConfig.direct) {
    const modelId = character.callConfig.direct.modelId;
    console.log('Looking for model:', {
      modelId,
      availableModels: modelState.models.map(m => ({ id: m.id, name: m.name }))
    });
    
    const foundModel = modelState.models.find(m => m.id === modelId);
    if (foundModel) {
      modelConfig = foundModel;
      console.log('Found model configuration:', foundModel);
    } else {
      console.warn(`未找到模型配置 ${modelId}`, {
        searchedId: modelId,
        availableModels: modelState.models
      });
    return <div>未找到模型配置</div>;
    }
  } else if (character.callConfig?.type === 'dify' && character.callConfig.dify) {
    // 处理 Dify 配置
    modelConfig = {
      id: `dify_${Date.now()}`,
      name: 'Dify Workflow',
      provider: 'dify',
      model: 'workflow',
      parameters: {
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 2000
      },
      auth: {
        apiKey: character.callConfig.dify.apiKey || '',
        baseUrl: character.callConfig.dify.serverUrl || '',
        organizationId: ''
      },
      isEnabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    console.log('Created Dify model configuration:', modelConfig);
  } else {
    console.error('角色配置无效:', {
      character,
      callConfig: character.callConfig
    });
    return <div>角色缺少必要的模型配置</div>;
  }

  // 构建系统提示词
  const buildSystemPrompt = (type: 'thoughts' | 'speech') => {
    if (!context) return '';

    const baseInfo = [
      `当前辩论主题：${context.topic.title}`,
      `背景信息：${context.topic.background}`,
      `当前是第 ${context.currentRound}/${context.totalRounds} 轮辩论`
    ];

    if (type === 'thoughts') {
      return `你是一位专业的辩论选手，现在需要你以思考者的身份，分析当前辩论局势并思考策略。
你的角色信息：
- 姓名：${character.name}
- 性格：${character.persona.personality.join(', ')}
- 说话风格：${character.persona.speakingStyle}
- 专业背景：${character.persona.background}
- 价值观：${character.persona.values.join(', ')}
- 论证风格：${character.persona.argumentationStyle.join(', ')}

${baseInfo.join('\n')}

请以内心独白的方式，分析当前局势并思考下一步策略。注意：
1. 保持角色特征的一致性
2. 分析其他选手的论点优劣
3. 思考可能的反驳方向
4. 规划下一步的论证策略`;
    } else {
      return `你是一位专业的辩论选手，现在需要你基于之前的思考，生成正式的辩论发言。
你的角色信息：
- 姓名：${character.name}
- 性格：${character.persona.personality.join(', ')}
- 说话风格：${character.persona.speakingStyle}
- 专业背景：${character.persona.background}
- 价值观：${character.persona.values.join(', ')}
- 论证风格：${character.persona.argumentationStyle.join(', ')}

${baseInfo.join('\n')}

请基于以上信息，生成正式的辩论发言。要求：
1. 保持角色特征的一致性
2. 论述要有逻辑性和说服力
3. 适当回应其他选手的观点
4. 展现个人特色和风格`;
    }
  };

  const { loading, error, testStream } = useModelTest({
    modelConfig: adaptModelConfig(modelConfig),
    onStreamOutput: (response) => {
      const newContent = response.content;
      setOutput(prev => {
        const lastOutput = prev[prev.length - 1] || '';
        const updatedOutput = [...prev.slice(0, -1), lastOutput + newContent];
        return updatedOutput;
      });
      
      if (onSpeechGenerated) {
        onSpeechGenerated({
          id: crypto.randomUUID(),
          playerId: player.id,
          content: newContent,
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

  const handleInnerThoughts = async () => {
    if (loading) return;
    setOutput([]);
    await testStream('生成内心OS', buildSystemPrompt('thoughts'));
  };

  const handleSpeech = async () => {
    if (loading) return;
    setOutput([]);
    await testStream('生成正式发言', buildSystemPrompt('speech'));
  };

  const handleClearOutput = () => {
    setOutput([]);
  };

  return (
    <Container>
      <Header>
        <Title>
          {player.name} 测试面板
          <CharacterInfo>
            角色: {character.name} (ID: {character.id})
          </CharacterInfo>
        </Title>
        <ModelInfo>
          {character.callConfig?.type === 'direct' ? (
            <>
              <ModelTag>{modelConfig.provider}</ModelTag>
              <ModelTag>{modelConfig.model}</ModelTag>
            </>
          ) : (
            <ModelTag>Dify工作流</ModelTag>
          )}
        </ModelInfo>
      </Header>
      
      <Content>
        <ButtonGroup>
          <Button 
            onClick={handleInnerThoughts}
            disabled={loading}
            style={{ backgroundColor: '#722ed1' }}
          >
            内心OS
          </Button>
          <Button 
            onClick={handleSpeech}
            disabled={loading}
            style={{ backgroundColor: '#1890ff' }}
          >
            正式发言
          </Button>
        </ButtonGroup>
          {error && (
            <ErrorMessage>
              {error.message}
            </ErrorMessage>
          )}
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
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  margin: 0;
`;

const ModelInfo = styled.div`
  display: flex;
  gap: 4px;
`;

const ModelTag = styled.span`
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button`
  padding: 8px 16px;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  flex: 1;

  &:disabled {
    background: #d9d9d9;
    cursor: not-allowed;
  }

  &:hover {
    opacity: 0.9;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4d4f;
  margin-top: 8px;
`;

const CharacterInfo = styled.div`
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
`;

const ErrorContainer = styled.div`
  padding: 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  margin: 16px;
`;

const ErrorDetail = styled.div`
  font-size: 12px;
  color: #ff7875;
  margin-top: 8px;
`;

export default AITestPanel; 