import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Typography, Spin, Divider, Alert } from 'antd';
import { LLMService } from '../modules/debate-flow/services/LLMService';
import { ScoringSystem } from '../modules/debate-flow/services/ScoringSystem';
import type { ProcessedSpeech, ScoringContext, ScoringRules, Score } from '../modules/debate-flow/types/interfaces';
import type { CharacterConfig } from '../modules/character/types';
import { StoreManager } from '../modules/state/core/StoreManager';

const { TextArea } = Input;
const { Title, Text } = Typography;

// 测试用的评分规则
const defaultScoringRules: ScoringRules = {
  dimensions: [
    {
      name: "逻辑性",
      weight: 30,
      description: "论证的逻辑严密程度",
      criteria: ["论点清晰", "论证充分", "结构完整"]
    },
    {
      name: "创新性",
      weight: 20,
      description: "观点和论证的创新程度",
      criteria: ["视角新颖", "论证方式创新", "例证独特"]
    },
    {
      name: "表达性",
      weight: 20,
      description: "语言表达的准确性和流畅性",
      criteria: ["用词准确", "语言流畅", "表达清晰"]
    },
    {
      name: "互动性",
      weight: 30,
      description: "与对方观点的互动和回应程度",
      criteria: ["回应准确", "反驳有力", "互动充分"]
    }
  ]
};

const defaultSpeech = `我认为人工智能的发展应该受到适度监管。首先，从安全角度来看，AI技术的快速发展可能带来不可预见的风险。
例如，在自动驾驶领域，如果没有适当的监管标准，可能会导致严重的安全事故。

其次，从伦理角度考虑，AI的决策过程需要保持透明和可解释性。如果没有监管，AI系统可能会做出带有偏见或歧视的决策，
这将损害社会公平。

最后，针对对方提出的"监管会阻碍创新"的观点，我认为恰恰相反。合理的监管框架能够为AI发展提供清晰的指导方向，
反而会促进负责任的创新。就像交通规则不是为了限制出行，而是为了确保安全有序一样。`;

const ScoringTest: React.FC = () => {
  const [speech, setSpeech] = useState(defaultSpeech);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<Score | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [judge, setJudge] = useState<CharacterConfig | null>(null);
  const [scoringRules, setScoringRules] = useState<ScoringRules>(defaultScoringRules);
  const [scoringDescription, setScoringDescription] = useState<string>('');
  const [streamingComment, setStreamingComment] = useState<string>('');
  const [dimensions, setDimensions] = useState<Record<string, number>>({});
  const [isCommentComplete, setIsCommentComplete] = useState(false);
  const scoringSystemRef = useRef<ScoringSystem | null>(null);

  useEffect(() => {
    const loadJudgeAndRules = async () => {
      try {
        const storeManager = StoreManager.getInstance();
        
        // 等待存储初始化完成
        await storeManager.hydrateAll();
        
        // 加载游戏配置
        const gameConfigStore = storeManager.getStore('gameConfig');
        const gameConfig = await gameConfigStore.getState();
        console.log('游戏配置:', gameConfig);
        
        if (!gameConfig?.debate?.judging?.selectedJudge?.id) {
          throw new Error('未找到选定的裁判');
        }

        // 加载评分规则
        if (gameConfig.debate.judging) {
          console.log('评分规则:', gameConfig.debate.judging);
          const { description, dimensions } = gameConfig.debate.judging;
          setScoringDescription(description || '');
          if (dimensions) {
            setScoringRules({
              dimensions: dimensions
            });
          }
        }

        // 从游戏配置中获取裁判ID
        const judgeId = gameConfig.debate.judging.selectedJudge.id;
        console.log('选定的裁判ID:', judgeId);
        
        // 从 LocalStorage 中获取角色配置
        const characterConfigsStr = localStorage.getItem('character_configs');
        if (!characterConfigsStr) {
          throw new Error('未找到角色配置数据');
        }
        
        const characterConfigs = JSON.parse(characterConfigsStr);
        console.log('角色配置列表:', characterConfigs);
        
        // 在角色列表中查找匹配ID的角色
        const selectedJudge = characterConfigs.find((char: CharacterConfig) => char.id === judgeId);
        console.log('选定的裁判配置:', selectedJudge);
        
        if (!selectedJudge) {
          throw new Error(`未找到ID为 ${judgeId} 的裁判角色配置`);
        }

        // 初始化LLM服务
        const llmService = new LLMService();
        await llmService['initialize'](selectedJudge.id);
        console.log('LLM服务初始化完成');

        setJudge(selectedJudge);
      } catch (err) {
        console.error('加载裁判和规则失败:', err);
        setError(err instanceof Error ? err.message : '加载裁判和规则失败');
      }
    };

    loadJudgeAndRules();
  }, []);

  const handleTest = async () => {
    if (!judge) {
      setError('未找到裁判信息');
      return;
    }

    setLoading(true);
    setError(null);
    setScore(null);
    setStreamingComment('');
    setDimensions({});
    setIsCommentComplete(false);

    try {
      const testSpeech: ProcessedSpeech = {
        id: `test_speech_${Date.now()}`,
        playerId: "player_1",
        content: speech,
        type: "speech",
        timestamp: Date.now(),
        round: 1,
        role: "assistant",
        metadata: {
          wordCount: speech.split(/\s+/).length
        }
      };

      const testContext: ScoringContext = {
        judge: {
          id: judge.id,
          name: judge.name,
          characterConfig: judge
        },
        rules: scoringRules,
        previousScores: [],
        topic: {
          title: '人工智能的发展应该受到适度监管',
          description: '人工智能的发展应该受到适度监管'
        },
        currentRound: 1,
        totalRounds: 1
      };

      const llmService = new LLMService();
      const scoringSystem = new ScoringSystem(llmService);
      scoringSystemRef.current = scoringSystem;

      // 订阅评分事件
      scoringSystem.onCommentStart(() => {
        console.log('开始生成评语');
        setStreamingComment('');
        setIsCommentComplete(false);
      });

      scoringSystem.onCommentUpdate((chunk: string) => {
        console.log('评语更新:', chunk);
        setStreamingComment(prev => prev + chunk);
      });

      scoringSystem.onCommentComplete((comment: string) => {
        console.log('评语完成:', comment);
        setIsCommentComplete(true);
      });

      scoringSystem.onDimensionUpdate(({ dimension, score }) => {
        console.log('维度分数更新:', dimension, score);
        setDimensions(prev => ({
          ...prev,
          [dimension]: score
        }));
      });

      const result = await scoringSystem.generateScore(testSpeech, testContext);
      setScore(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '评分过程出错');
    } finally {
      setLoading(false);
      // 清理事件监听
      if (scoringSystemRef.current) {
        scoringSystemRef.current.removeAllListeners();
      }
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Title level={2}>评分系统测试</Title>
      
      <Card title="评分规则" className="mb-6">
        {scoringDescription && (
          <Alert
            message="评分说明"
            description={scoringDescription}
            type="info"
            showIcon
            className="mb-4"
          />
        )}
        <div className="grid grid-cols-2 gap-4">
          {scoringRules.dimensions.map(dim => (
            <Card key={dim.name} size="small" title={`${dim.name} (${dim.weight}分)`}>
              <Text>{dim.description}</Text>
              <div className="mt-2">
                <Text type="secondary">评分标准：{dim.criteria.join('、')}</Text>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card title="当前裁判" className="mb-6">
        {judge ? (
          <div>
            <Text strong>{judge.name}</Text>
            {judge.persona?.personality?.length > 0 && (
              <div className="mt-2">
                <Text type="secondary">性格特征：{judge.persona.personality.join('、')}</Text>
              </div>
            )}
          </div>
        ) : (
          <Text type="warning">正在加载裁判信息...</Text>
        )}
      </Card>

      <Card title="测试发言" className="mb-6">
        <TextArea
          value={speech}
          onChange={e => setSpeech(e.target.value)}
          rows={8}
          className="mb-4"
        />
        <Button 
          type="primary" 
          onClick={handleTest} 
          loading={loading}
          disabled={!judge}
        >
          生成评分
        </Button>
      </Card>

      {loading && (
        <Card>
          <div className="text-center py-4">
            <Spin tip="正在生成评分..." />
          </div>
          {streamingComment && (
            <div className="mt-4">
              <Title level={4}>总体评价</Title>
              <div className="p-4 bg-gray-50 rounded">
                <Text>{streamingComment}</Text>
              </div>
            </div>
          )}
          {isCommentComplete && Object.keys(dimensions).length > 0 && (
            <div className="mt-4">
              <Divider>维度评分</Divider>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(dimensions).map(([dimension, score]) => (
                  <Card key={dimension} size="small">
                    <div className="flex justify-between items-center">
                      <Text strong>{dimension}</Text>
                      <Text>{score}分</Text>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {error && (
        <Card className="mt-4 bg-red-50">
          <Text type="danger">{error}</Text>
        </Card>
      )}

      {score && !loading && (
        <Card title="评分结果" className="mt-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {Object.entries(score.dimensions).map(([dim, value]) => (
              <Card key={dim} size="small">
                <div className="flex justify-between items-center">
                  <Text strong>{dim}</Text>
                  <Text>{value}分</Text>
                </div>
              </Card>
            ))}
          </div>
          
          <Divider />
          
          <div className="flex justify-between items-center mb-4">
            <Text strong>总分</Text>
            <Text>{score.totalScore.toFixed(2)}分</Text>
          </div>
          
          <div>
            <Text strong>评语：</Text>
            <div className="mt-2 p-4 bg-gray-50 rounded">
              <Text>{score.comment}</Text>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ScoringTest; 