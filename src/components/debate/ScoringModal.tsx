import React, { useState, useEffect, useCallback } from 'react';
import styled from '@emotion/styled';
import { Modal, Avatar, Table, Spin, Button, message, Tabs } from 'antd';
import type { UnifiedPlayer, Score, BaseDebateSpeech } from '../../types/adapters';

// 添加轮次评分的接口定义
interface RoundScores {
  [round: number]: Score[];
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
  } | null;
  scoringRules: Array<{
    id: string;
    name: string;
    weight: number;
    description: string;
    criteria: string[];
  }>;
  onScoringComplete: (speech: BaseDebateSpeech) => void;
  onNextRound: () => void;
}

export const ScoringModal: React.FC<ScoringModalProps> = ({
  visible,
  onClose,
  players,
  currentRound,
  judge,
  scoringRules,
  onScoringComplete,
  onNextRound
}) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [roundScores, setRoundScores] = useState<RoundScores>({});
  const [isScoring, setIsScoring] = useState(false);
  const [currentScore, setCurrentScore] = useState<Score | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('current');

  // 获取当前轮次的评分
  const getCurrentRoundScores = () => roundScores[currentRound] || [];
  
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
    
    console.log('当前状态:', {
      currentRound,
      currentPlayerIndex,
      totalPlayers: players.length,
      isScoring,
      currentRoundScores: currentRoundScores.length
    });

    if (currentPlayerIndex >= players.length) {
      console.log('❌ 评分终止: 当前索引超出选手范围');
      return;
    }

    if (isScoring) {
      console.log('❌ 评分终止: 正在评分中');
      return;
    }

    const currentPlayer = players[currentPlayerIndex];
    
    // 检查该选手在当前轮次是否已有评分
    const hasExistingScore = currentRoundScores.some(
      score => score.playerId === currentPlayer.id
    );
    
    if (hasExistingScore) {
      console.log('❌ 评分终止: 该选手在当前轮次已有评分');
      setCurrentPlayerIndex(prev => prev + 1);
      return;
    }

    console.log('✅ 开始为选手评分:', {
      round: currentRound,
      playerName: currentPlayer?.name,
      playerId: currentPlayer?.id,
      playerIndex: currentPlayerIndex,
      totalPlayers: players.length
    });

    setIsScoring(true);
    setError(null);

    try {
      // 生成评分
      const mockScore: Score = {
        id: `score_${currentRound}_${currentPlayer.id}_${Date.now()}`,
        speechId: `speech_${currentRound}_${currentPlayer.id}`,
        judgeId: judge?.id || 'system',
        playerId: currentPlayer.id,
        round: currentRound,
        timestamp: String(Date.now()),
        dimensions: scoringRules.reduce<DimensionScores>((acc, rule) => ({
          ...acc,
          [rule.id]: Math.floor(Math.random() * 20) + 80
        }), {}),
        totalScore: 0,
        feedback: {
          strengths: ['论点清晰', '论证有力', '表达流畅'],
          weaknesses: ['可以进一步加强论证', '反驳力度可以增强'],
          suggestions: ['建议增加更多具体例证', '可以更好地回应对方论点']
        },
        comment: `第${currentRound}轮评分：${currentPlayer.name}的表现`
      };

      // 计算总分
      mockScore.totalScore = Object.entries(mockScore.dimensions).reduce((total, [dimId, score]) => {
        const rule = scoringRules.find(r => r.id === dimId);
        return total + (score * (rule?.weight || 0));
      }, 0);

      console.log('✅ 评分生成成功:', {
        round: currentRound,
        playerName: currentPlayer.name,
        playerId: currentPlayer.id,
        scoreId: mockScore.id,
        totalScore: mockScore.totalScore
      });

      setCurrentScore(mockScore);
      
      // 更新当前轮次的评分
      setRoundScores(prev => ({
        ...prev,
        [currentRound]: [...(prev[currentRound] || []), mockScore]
      }));

      // 确保状态更新完成后再进行下一步
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsScoring(false);
      setCurrentPlayerIndex(prev => prev + 1);

    } catch (err) {
      console.error('❌ 评分生成失败:', err);
      setError('评分生成失败');
      setIsScoring(false);
    }
  }, [currentPlayerIndex, players, judge, currentRound, scoringRules]);

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

  // 获取表格数据
  const getTableData = (roundScores: Score[]) => {
    return roundScores.map(score => {
      const player = players.find(p => p.id === score.playerId);
      return {
        key: score.id,
        playerName: player?.name,
        totalScore: score.totalScore,
        dimensions: score.dimensions
      };
    });
  };

  // 生成标签项
  const getTabs = () => {
    const tabs = [{
      key: 'current',
      label: `第${currentRound}轮`,
      children: (
        <RoundTab>
          <PlayerList>
            {players.map((player, index) => (
              <PlayerCard key={player.id}>
                <Avatar 
                  size={64} 
                  src={player.avatar}
                  style={{
                    border: currentPlayerIndex === index ? '2px solid #1890ff' : 'none',
                    opacity: index < currentPlayerIndex ? 0.5 : 1
                  }}
                >
                  {player.name[0]}
                </Avatar>
                <PlayerName>{player.name}</PlayerName>
                {index < currentPlayerIndex && (
                  <div style={{ color: '#52c41a', fontSize: '12px' }}>已评分</div>
                )}
              </PlayerCard>
            ))}
          </PlayerList>

          <ScoringProcess>
            {isScoring ? (
              <>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin />
                  <div style={{ marginTop: '10px' }}>
                    正在评分：{players[currentPlayerIndex]?.name}（{currentPlayerIndex + 1}/{players.length}）
                  </div>
                </div>
                {error && (
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <div style={{ color: '#ff4d4f', marginBottom: '8px' }}>{error}</div>
                    <Button onClick={handleRetry} style={{ marginRight: '8px' }}>重试</Button>
                    <Button onClick={handleSkip}>跳过</Button>
                  </div>
                )}
              </>
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
                  return (
                    <ScoreCard key={score.id}>
                      <ScoreHeader>
                        <h3>
                          {player?.name} 的评分
                          <span style={{ fontSize: '14px', color: '#8c8c8c', marginLeft: '8px' }}>
                            （{index + 1}/{players.length}）
                          </span>
                        </h3>
                        <div style={{ fontSize: '24px', color: '#1890ff' }}>
                          {score.totalScore.toFixed(1)}分
                        </div>
                      </ScoreHeader>
                      
                      <ScoreContent>
                        {Object.entries(score.dimensions).map(([dimId, dimScore]: [string, number]) => {
                          const rule = scoringRules.find(r => r.id === dimId);
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
                        <div style={{ color: '#52c41a', marginBottom: '8px' }}>
                          优点：{score.feedback.strengths.join('、')}
                        </div>
                        <div style={{ color: '#ff4d4f', marginBottom: '8px' }}>
                          不足：{score.feedback.weaknesses.join('、')}
                        </div>
                        <div style={{ color: '#1890ff' }}>
                          建议：{score.feedback.suggestions.join('、')}
                        </div>
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
              return (
                <ScoreCard key={score.id}>
                  <ScoreHeader>
                    <h3>
                      {player?.name} 的评分
                      <span style={{ fontSize: '14px', color: '#8c8c8c', marginLeft: '8px' }}>
                        （{index + 1}/{players.length}）
                      </span>
                    </h3>
                    <div style={{ fontSize: '24px', color: '#1890ff' }}>
                      {score.totalScore.toFixed(1)}分
                    </div>
                  </ScoreHeader>
                  
                  <ScoreContent>
                    {Object.entries(score.dimensions).map(([dimId, dimScore]: [string, number]) => {
                      const rule = scoringRules.find(r => r.id === dimId);
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
                    <div style={{ color: '#52c41a', marginBottom: '8px' }}>
                      优点：{score.feedback.strengths.join('、')}
                    </div>
                    <div style={{ color: '#ff4d4f', marginBottom: '8px' }}>
                      不足：{score.feedback.weaknesses.join('、')}
                    </div>
                    <div style={{ color: '#1890ff' }}>
                      建议：{score.feedback.suggestions.join('、')}
                    </div>
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
      render: (score: number) => score.toFixed(1),
      sorter: (a: any, b: any) => a.totalScore - b.totalScore,
    },
    ...scoringRules.map(rule => ({
      title: rule.name,
      dataIndex: ['dimensions', rule.id],
      key: rule.id,
      render: (score: number) => score.toFixed(1)
    }))
  ];

  // 在组件返回之前添加日志
  useEffect(() => {
    console.log('评分面板状态:', {
      scoresLength: getCurrentRoundScores().length,
      playersLength: players.length,
      isScoring,
      shouldShowNextRoundButton: getCurrentRoundScores().length > 0 && getCurrentRoundScores().length === players.length && !isScoring
    });
  }, [getCurrentRoundScores().length, players.length, isScoring]);

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
            {getCurrentRoundScores().length > 0 && getCurrentRoundScores().length === players.length && !isScoring && (
              <Button type="primary" onClick={handleComplete}>
                进入下一轮
              </Button>
            )}
          </HeaderActions>
        </ModalHeader>
      }
    >
      <JudgeSection>
        <JudgeHeader>
          <Avatar size={48} src={judge?.avatar}>
            {judge?.name[0]}
          </Avatar>
          <div>
            <h3>{judge?.name}</h3>
            <p>{judge?.description}</p>
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