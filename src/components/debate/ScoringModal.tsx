import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from '@emotion/styled';
import { Modal, Avatar, Table, Spin, Button, message, Tabs, Typography } from 'antd';
import { LLMService } from '../../modules/debate-flow/services/LLMService';
import { ScoringSystem } from '../../modules/debate-flow/services/ScoringSystem';
import type { UnifiedPlayer, Score, BaseDebateSpeech, BaseDebateScore } from '../../types/adapters';
import type { ProcessedSpeech, ScoringContext } from '../../modules/debate-flow/types/interfaces';
import type { CharacterConfig } from '../../modules/character/types';

const { Title, Text } = Typography;

// 添加轮次评分的接口定义
interface RoundScores {
  [round: number]: BaseDebateScore[];
}

// 添加维度分数的接口定义
interface DimensionScores {
  [dimensionId: string]: number;
}

const PlayerList = styled.div`
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
`;

const PlayerCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const PlayerName = styled.div`
  font-size: 14px;
  font-weight: 500;
`;

const JudgeSection = styled.div`
  margin: 20px 0;
  padding: 20px;
  background: #f8f8f8;
  border-radius: 8px;
`;

const JudgeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const RuleSection = styled.div`
  margin-top: 16px;
`;

const ScoringProcess = styled.div`
  margin-top: 20px;
`;

const ProcessItem = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const ScoreCard = styled.div`
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const ScoreHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const ScoreContent = styled.div`
  margin-top: 12px;
`;

const CommentSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #f0f0f0;
`;

const CommentContent = styled.div`
  color: #1890ff;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  padding: 12px 16px;
  background: rgba(24, 144, 255, 0.02);
  border-radius: 6px;
  border: 1px solid rgba(24, 144, 255, 0.1);
`;

const DimensionScore = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const TabContent = styled.div`
  padding: 16px 0;
`;

const RoundTab = styled.div`
  min-height: 300px;
`;

const OverviewTab = styled.div`
  padding: 20px;
`;

const RoundTitle = styled.h3`
  margin-bottom: 16px;
  color: #1890ff;
`;

interface ScoringModalProps {
  visible: boolean;
  onClose: () => void;
  players: UnifiedPlayer[];
  currentRound: number;
  judge: {
    id: string;
    name: string;
    avatar?: string;
    description?: string;
    characterConfig?: CharacterConfig;
  } | null;
  scoringRules: Array<{
    id: string;
    name: string;
    weight: number;
    description: string;
    criteria: string[];
  }>;
  speeches: BaseDebateSpeech[];
  onScoringComplete: (speech: BaseDebateSpeech) => void;
  onNextRound: () => void;
}

// 添加评分进度展示容器
const ScoringProgressContainer = styled.div`
  margin-top: 20px;
  padding: 20px;
  background: #f8f8f8;
  border-radius: 8px;
`;

const CommentStream = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: white;
  border-radius: 6px;
  min-height: 100px;
  white-space: pre-wrap;
`;

const DimensionScores = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 16px;
`;

const DimensionScoreItem = styled.div`
  background: white;
  padding: 12px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ScoringModal: React.FC<ScoringModalProps> = ({
  visible,
  onClose,
  players,
  currentRound,
  judge,
  scoringRules,
  speeches,
  onScoringComplete,
  onNextRound
}) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [roundScores, setRoundScores] = useState<RoundScores>({});
  const [currentScore, setCurrentScore] = useState<BaseDebateScore | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('current');
  const [streamingComment, setStreamingComment] = useState<string>('');
  const [dimensions, setDimensions] = useState<Record<string, number>>({});
  const [isCommentComplete, setIsCommentComplete] = useState(false);
  const scoringSystemRef = useRef<ScoringSystem | null>(null);
  const llmServiceRef = useRef<LLMService | null>(null);

  // 获取当前轮次的评分
  const getCurrentRoundScores = useCallback(() => 
    roundScores[currentRound] || [], 
    [roundScores, currentRound]
  );
  
  // 重置状态时保留历史轮次数据
  useEffect(() => {
    console.log('评分面板可见性变更:', {
      visible,
      currentRound,
      roundScores,
      isScoring
    });

    if (visible) {
      // 仅重置当前轮次相关的状态
      setCurrentPlayerIndex(0);
      setIsScoring(false);
      setCurrentScore(null);
      setError(null);
      setActiveTab('current');
      
      // 确保当前轮次的评分数组已初始化
      setRoundScores(prev => ({
        ...prev,
        [currentRound]: prev[currentRound] || []
      }));
      
      console.log('评分面板状态已重置:', {
        currentRound,
        currentPlayerIndex: 0,
        currentRoundScores: roundScores[currentRound]?.length || 0,
        totalPlayers: players.length
      });

      // 自动开始第一个选手的评分
      setTimeout(() => {
        startScoring();
      }, 500);
    }
  }, [visible, currentRound]);

  // 修改自动评分逻辑
  useEffect(() => {
    const currentRoundScores = getCurrentRoundScores();
    
    console.log('===== 评分状态检查 =====', {
      visible,
      isScoring,
      currentPlayerIndex,
      currentRound,
      totalPlayers: players.length,
      currentRoundScores: currentRoundScores.length,
      shouldStartScoring: visible && !isScoring && currentPlayerIndex < players.length && currentRoundScores.length < players.length
    });

    if (visible && !isScoring && currentPlayerIndex < players.length && currentRoundScores.length < players.length) {
      console.log('✅ 触发评分开始:', {
        currentRound,
        currentIndex: currentPlayerIndex,
        totalPlayers: players.length,
        currentPlayer: players[currentPlayerIndex]?.name,
        scoresCount: currentRoundScores.length
      });
      startScoring();
    }
  }, [visible, isScoring, currentPlayerIndex, players.length, currentRound]);

  const startScoring = useCallback(async () => {
    console.log('===== 开始评分流程 =====');
    const currentRoundScores = getCurrentRoundScores();
    
    if (currentPlayerIndex >= players.length) {
      console.log('❌ 评分终止: 当前索引超出选手范围');
      return;
    }

    if (isScoring) {
      console.log('❌ 评分终止: 正在评分中');
      return;
    }

    const currentPlayer = players[currentPlayerIndex];
    const characterConfig = currentPlayer.characterId ? getCharacterConfig(currentPlayer.characterId) : null;
    
    // 检查该选手在当前轮次是否已有评分
    const hasExistingScore = currentRoundScores.some(
      score => score.playerId === currentPlayer.id
    );
    
    if (hasExistingScore) {
      console.log('❌ 评分终止: 该选手在当前轮次已有评分');
      setCurrentPlayerIndex(prev => prev + 1);
      return;
    }

    // 查找当前选手的发言
    const currentSpeech = speeches.find(
      speech => speech.playerId === currentPlayer.id && 
                speech.round === currentRound && 
                speech.type === 'speech' // 只处理正式发言
    );

    if (!currentSpeech) {
      console.error('未找到选手发言记录');
      setError(`未找到 ${characterConfig?.name || currentPlayer.name} 的正式发言记录`);
      return;
    }

    console.log('✅ 开始为选手评分:', {
      round: currentRound,
      playerName: characterConfig?.name || currentPlayer?.name,
      playerId: currentPlayer?.id,
      playerIndex: currentPlayerIndex,
      totalPlayers: players.length,
      judgeInfo: judge
    });

    setIsScoring(true);
    setError(null);
    setStreamingComment('');
    setDimensions({});
    setIsCommentComplete(false);

    try {
      if (!scoringSystemRef.current) {
        throw new Error('评分系统未初始化');
      }

      const scoringContext: ScoringContext = {
        judge: {
          id: judge?.characterConfig?.id || judge?.id || 'system',
          name: judge?.name || '系统评委',
          characterConfig: judge?.characterConfig
        },
        rules: {
          dimensions: scoringRules
        },
        previousScores: getCurrentRoundScores().map(score => ({
          ...score,
          timestamp: Date.now()
        }))
      };

      const processedSpeech: ProcessedSpeech = {
        id: currentSpeech.id,
        playerId: currentSpeech.playerId,
        content: `发言人：${characterConfig?.name || currentPlayer.name}\n\n${currentSpeech.content}`,
        type: currentSpeech.type,
        role: currentSpeech.role,
        round: currentSpeech.round,
        timestamp: Date.now(),
        references: currentSpeech.references || [],
        metadata: {
          wordCount: currentSpeech.content.length
        }
      };

      const result = await scoringSystemRef.current.generateScore(
        processedSpeech,
        scoringContext
      );

      // 创建评分对象
      const score: BaseDebateScore = {
        id: `score_${currentRound}_${currentPlayer.id}_${Date.now()}`,
        speechId: processedSpeech.id,
        judgeId: judge?.characterConfig?.id || judge?.id || 'system',
        playerId: currentPlayer.id,
        round: currentRound,
        timestamp: String(Date.now()),
        dimensions: result.dimensions,
        totalScore: result.totalScore,
        feedback: {
          strengths: result.comment ? [result.comment] : [],
          weaknesses: [],
          suggestions: []
        },
        comment: result.comment?.replace(/\n+/g, '\n\n')  // 规范化换行符
      };

      setCurrentScore(score);
      
      // 更新当前轮次的评分
      setRoundScores(prev => ({
        ...prev,
        [currentRound]: [...(prev[currentRound] || []), score]
      }));

      // 确保状态更新完成后再进行下一步
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsScoring(false);
      setCurrentPlayerIndex(prev => prev + 1);

    } catch (err) {
      console.error('❌ 评分生成失败:', err);
      setError(err instanceof Error ? err.message : '评分生成失败');
      setIsScoring(false);
    }
  }, [currentPlayerIndex, players, judge, currentRound, scoringRules, speeches, getCurrentRoundScores]);

  const handleRetry = () => {
    startScoring();
  };

  const handleSkip = () => {
    setCurrentPlayerIndex(prev => prev + 1);
    setError(null);
  };

  const handleComplete = async () => {
    const currentRoundScores = getCurrentRoundScores();
    
    console.log('===== 完成评分 =====', {
      currentRound,
      totalScores: currentRoundScores.length,
      totalPlayers: players.length,
      allScores: roundScores
    });

    if (currentRoundScores.length === players.length && !isScoring) {
      // 触发评分完成回调
      await onScoringComplete({
        id: `speech_${currentRound}_${Date.now()}`,
        playerId: 'system',
        content: `第${currentRound}轮评分完成，准备进入下一轮`,
        timestamp: String(Date.now()),
        round: currentRound,
        references: [],
        role: 'system',
        type: 'system'
      });

      // 关闭评分面板
      onClose();

      // 延迟一小段时间后触发进入下一轮
      setTimeout(() => {
        onNextRound();
      }, 1000);
    }
  };

  // 渲染总览标签内容
  const renderOverview = () => {
    const allRounds = Object.keys(roundScores).map(Number).sort((a, b) => a - b);
    
    return (
      <OverviewTab>
        <h2>评分总览</h2>
        {allRounds.map(round => (
          <div key={round}>
            <RoundTitle>第{round}轮评分</RoundTitle>
            <Table 
              columns={columns}
              dataSource={getTableData(roundScores[round])}
              pagination={false}
            />
          </div>
        ))}
      </OverviewTab>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '选手',
      dataIndex: 'playerName',
      key: 'playerName',
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      render: (score: number) => ((score || 0) * 100).toFixed(1),
      sorter: (a: any, b: any) => (a.totalScore || 0) - (b.totalScore || 0),
    },
    ...scoringRules.map(rule => ({
      title: rule.name,
      dataIndex: ['dimensions', rule.name],
      key: rule.name,
      render: (score: number) => (score || 0).toFixed(1),
      width: 100
    }))
  ];

  // 获取角色配置
  const getCharacterConfig = useCallback((characterId: string) => {
    try {
      const configs = localStorage.getItem('character_configs');
      if (configs) {
        const characterConfigs = JSON.parse(configs);
        return characterConfigs.find((config: any) => config.id === characterId);
      }
    } catch (error) {
      console.error('获取角色配置失败:', error);
    }
    return null;
  }, []);

  // 获取表格数据
  const getTableData = (roundScores: BaseDebateScore[]) => {
    return roundScores.map(score => {
      const player = players.find(p => p.id === score.playerId);
      const characterConfig = player?.characterId ? getCharacterConfig(player.characterId) : null;
      
      return {
        key: score.id,
        playerName: characterConfig?.name || player?.name || score.playerId,
        totalScore: score.totalScore || 0,
        dimensions: score.dimensions || {}
      };
    });
  };

  // 修改 PlayerList 渲染部分
  const renderPlayerList = () => (
    <PlayerList>
      {players.map((player, index) => {
        const characterConfig = player.characterId ? getCharacterConfig(player.characterId) : null;
        return (
          <PlayerCard key={player.id}>
            <Avatar 
              size={64} 
              src={characterConfig?.avatar || player.avatar}
              style={{
                border: currentPlayerIndex === index ? '2px solid #1890ff' : 'none',
                opacity: index < currentPlayerIndex ? 0.5 : 1
              }}
            >
              {(characterConfig?.name || player.name)?.[0]}
            </Avatar>
            <PlayerName>{characterConfig?.name || player.name}</PlayerName>
            {index < currentPlayerIndex && (
              <div style={{ color: '#52c41a', fontSize: '12px' }}>已评分</div>
            )}
          </PlayerCard>
        );
      })}
    </PlayerList>
  );

  // 生成标签项
  const getTabs = () => {
    const tabs = [{
      key: 'current',
      label: `第${currentRound}轮`,
      children: (
        <RoundTab>
          {renderPlayerList()}
          <ScoringProcess>
            {isScoring ? (
              <ScoringProgressContainer>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <Spin />
                  <div style={{ marginTop: '10px' }}>
                    正在评分：{players[currentPlayerIndex]?.name}（{currentPlayerIndex + 1}/{players.length}）
                  </div>
                </div>

                {streamingComment && (
                  <div>
                    <Title level={4}>评语生成中</Title>
                    <CommentStream>{streamingComment}</CommentStream>
                  </div>
                )}

                {Object.keys(dimensions).length > 0 && (
                  <div>
                    <Title level={4} style={{ marginTop: '20px' }}>维度评分</Title>
                    <DimensionScores>
                      {Object.entries(dimensions).map(([dimension, score]) => (
                        <DimensionScoreItem key={dimension}>
                          <Text strong>{dimension}</Text>
                          <Text>{score.toFixed(1)}分</Text>
                        </DimensionScoreItem>
                      ))}
                    </DimensionScores>
                  </div>
                )}

                {error && (
                  <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <div style={{ color: '#ff4d4f', marginBottom: '8px' }}>{error}</div>
                    <Button onClick={handleRetry} style={{ marginRight: '8px' }}>重试</Button>
                    <Button onClick={handleSkip}>跳过</Button>
                  </div>
                )}
              </ScoringProgressContainer>
            ) : (
              <>
                {getCurrentRoundScores().length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4>评分汇总（{getCurrentRoundScores().length}/{players.length}）</h4>
                    <Table 
                      columns={columns} 
                      dataSource={getTableData(getCurrentRoundScores())}
                      pagination={false}
                    />
                  </div>
                )}

                {getCurrentRoundScores().map((score, index) => {
                  const player = players.find(p => p.id === score.playerId);
                  const characterConfig = player?.characterId ? getCharacterConfig(player.characterId) : null;
                  const playerName = characterConfig?.name || player?.name || score.playerId;
                  return (
                    <ScoreCard key={score.id}>
                      <ScoreHeader>
                        <h3>
                          {playerName} 的评分
                          <span style={{ fontSize: '14px', color: '#8c8c8c', marginLeft: '8px' }}>
                            （{index + 1}/{players.length}）
                          </span>
                        </h3>
                        <div style={{ fontSize: '24px', color: '#1890ff' }}>
                          {((score.totalScore || 0) * 100).toFixed(1)}分
                        </div>
                      </ScoreHeader>
                      
                      <ScoreContent>
                        {Object.entries(score.dimensions).map(([dimId, dimScore]: [string, number]) => {
                          const rule = scoringRules.find(r => r.name === dimId);
                          if (!rule) return null;
                          return (
                            <DimensionScore key={dimId}>
                              <span>{rule.name}</span>
                              <span>{dimScore.toFixed(1)}分</span>
                            </DimensionScore>
                          );
                        })}
                      </ScoreContent>

                      <CommentSection>
                        <h4>评语</h4>
                        <CommentContent>
                          {score.comment}
                        </CommentContent>
                      </CommentSection>
                    </ScoreCard>
                  );
                })}
              </>
            )}
          </ScoringProcess>
        </RoundTab>
      )
    }];

    // 添加历史轮次标签
    const historyRounds = Object.keys(roundScores)
      .map(Number)
      .filter(round => round < currentRound)
      .sort((a, b) => b - a);

    historyRounds.forEach(round => {
      tabs.push({
        key: `round_${round}`,
        label: `第${round}轮`,
        children: (
          <RoundTab>
            <Table 
              columns={columns}
              dataSource={getTableData(roundScores[round])}
              pagination={false}
            />
            {roundScores[round].map((score, index) => {
              const player = players.find(p => p.id === score.playerId);
              const characterConfig = player?.characterId ? getCharacterConfig(player.characterId) : null;
              const playerName = characterConfig?.name || player?.name || score.playerId;
              return (
                <ScoreCard key={score.id}>
                  <ScoreHeader>
                    <h3>
                      {playerName} 的评分
                      <span style={{ fontSize: '14px', color: '#8c8c8c', marginLeft: '8px' }}>
                        （{index + 1}/{players.length}）
                      </span>
                    </h3>
                    <div style={{ fontSize: '24px', color: '#1890ff' }}>
                      {((score.totalScore || 0) * 100).toFixed(1)}分
                    </div>
                  </ScoreHeader>
                  
                  <ScoreContent>
                    {Object.entries(score.dimensions).map(([dimId, dimScore]: [string, number]) => {
                      const rule = scoringRules.find(r => r.name === dimId);
                      if (!rule) return null;
                      return (
                        <DimensionScore key={dimId}>
                          <span>{rule.name}</span>
                          <span>{dimScore.toFixed(1)}分</span>
                        </DimensionScore>
                      );
                    })}
                  </ScoreContent>

                  <CommentSection>
                    <h4>评语</h4>
                    <CommentContent>
                      {score.comment}
                    </CommentContent>
                  </CommentSection>
                </ScoreCard>
              );
            })}
          </RoundTab>
        )
      });
    });

    // 添加总览标签
    if (Object.keys(roundScores).length > 1) {
      tabs.push({
        key: 'overview',
        label: '总览',
        children: renderOverview()
      });
    }

    return tabs;
  };

  // 在组件返回之前添加日志
  useEffect(() => {
    console.log('评分面板状态:', {
      scoresLength: getCurrentRoundScores().length,
      playersLength: players.length,
      isScoring,
      shouldShowNextRoundButton: getCurrentRoundScores().length > 0 && getCurrentRoundScores().length === players.length && !isScoring
    });
  }, [getCurrentRoundScores().length, players.length, isScoring]);

  // 初始化评分服务
  useEffect(() => {
    const initializeScoringSystem = async () => {
      try {
        const llmService = new LLMService();
        // 设置玩家列表，并添加角色配置信息
        llmService.setPlayers(players.map(player => {
          const characterConfig = player.characterId ? getCharacterConfig(player.characterId) : null;
          return {
            id: player.id,
            name: characterConfig?.name || player.name,
            isAI: player.isAI,
            role: player.role,
            team: player.role.includes('affirmative') ? 'affirmative' : 'negative',
            characterId: player.characterId,
            avatar: characterConfig?.avatar || player.avatar
          };
        }));
        llmServiceRef.current = llmService;
        
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

        console.log('评分系统初始化完成');
      } catch (error) {
        console.error('初始化评分系统失败:', error);
        message.error('初始化评分系统失败');
      }
    };

    if (visible) {
      initializeScoringSystem();
    }

    return () => {
      // 清理事件监听
      if (scoringSystemRef.current) {
        scoringSystemRef.current.removeAllListeners();
      }
    };
  }, [visible, players]);

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      title={
        <ModalHeader>
          <HeaderTitle>第 {currentRound} 轮评分</HeaderTitle>
          <HeaderActions>
            {getCurrentRoundScores().length > 0 && !isScoring && (
              <>
                <Button 
                  onClick={() => {
                    setRoundScores(prev => ({
                      ...prev,
                      [currentRound]: []
                    }));
                    setCurrentPlayerIndex(0);
                    setCurrentScore(null);
                    setError(null);
                    setStreamingComment('');
                    setDimensions({});
                    setIsCommentComplete(false);
                    message.success('已重置本轮评分');
                  }}
                >
                  重新评分
                </Button>
                <Button type="primary" onClick={handleComplete}>
                  进入下一轮
                </Button>
              </>
            )}
          </HeaderActions>
        </ModalHeader>
      }
    >
      <JudgeSection>
        <JudgeHeader>
          <Avatar size={48} src={judge?.avatar}>
            {judge?.name?.[0] || 'S'}
          </Avatar>
          <div>
            <h3>{judge?.name || '系统评委'}</h3>
            <p>{judge?.description || '由AI驱动的智能评分系统'}</p>
          </div>
        </JudgeHeader>

        <RuleSection>
          <h4>评分规则</h4>
          {scoringRules.map(rule => (
            <div key={rule.id}>
              {rule.name}（权重：{(rule.weight * 100).toFixed(0)}%）- {rule.description}
            </div>
          ))}
        </RuleSection>
      </JudgeSection>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={getTabs()}
      />
    </Modal>
  );
}; 