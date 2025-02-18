import React, { useState } from 'react';
import { Card, Button, Space, Typography, Divider, message, Spin } from 'antd';
import type { BaseDebateScore } from '../../types/adapters';
import { DebateFlowService } from '../../modules/debate-flow/services/DebateFlowService';

const { Text } = Typography;

interface ScoringPanelProps {
  debateFlow: DebateFlowService;
  currentRound: number;
  scores: BaseDebateScore[];
  isScoring: boolean;
  onNextRound?: () => void;
}

export const ScoringPanel: React.FC<ScoringPanelProps> = ({ 
  debateFlow, 
  currentRound, 
  scores, 
  isScoring,
  onNextRound 
}) => {
  const [resetting, setResetting] = useState(false);

  const handleResetScoring = async () => {
    try {
      setResetting(true);
      await debateFlow.resetCurrentRoundScoring();
      message.success('重新开始评分');
    } catch (error) {
      message.error('重置评分失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setResetting(false);
    }
  };

  const currentRoundScores = scores.filter(score => score.round === currentRound);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '64px', 
      right: '20px', 
      width: '320px',
      zIndex: 1000,
      backgroundColor: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      borderRadius: '8px'
    }}>
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>第 {currentRound} 轮评分</span>
            <Space>
              <Button 
                type="primary"
                onClick={handleResetScoring}
                loading={resetting}
                disabled={isScoring}
              >
                重新评分
              </Button>
              {onNextRound && (
                <Button 
                  type="primary"
                  onClick={onNextRound}
                  disabled={isScoring}
                >
                  进入下一轮
                </Button>
              )}
            </Space>
          </div>
        }
        bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* 显示当前轮次的评分 */}
          {currentRoundScores.map((score, index) => (
            <Card key={score.id} size="small" className="mb-2">
              <div className="flex justify-between items-start">
                <div>
                  <Text strong>评分 {index + 1}</Text>
                  <div className="mt-2">
                    {Object.entries(score.dimensions).map(([dimension, value]) => (
                      <div key={dimension} className="flex justify-between">
                        <Text>{dimension}:</Text>
                        <Text>{value}分</Text>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Text strong>总分: {score.totalScore.toFixed(1)}</Text>
                </div>
              </div>
              {score.comment && (
                <div className="mt-2">
                  <Text type="secondary">评语: {score.comment}</Text>
                </div>
              )}
            </Card>
          ))}
          
          {isScoring && (
            <div className="text-center py-4">
              <Spin tip="正在生成评分..." />
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
}; 