import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { formatTimestamp, convertNumberToTimestamp } from '../../utils/timestamp';

// 定义Score类型
interface Score {
  id: string;
  judgeId: string;
  playerId: string;
  speechId: string;
  round: number;
  timestamp: string | number;
  dimensions: Record<string, number>;
  totalScore: number;
  comment: string;
}

// 样式定义
const Container = styled(motion.div)`
  background-color: var(--color-bg-light);
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Title = styled.div`
  font-weight: bold;
  color: var(--color-text-primary);
`;

const TotalScore = styled.div`
  font-size: 1.2em;
  font-weight: bold;
  color: var(--color-primary);
`;

const DimensionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DimensionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: var(--color-bg-white);
  border-radius: 4px;
`;

const DimensionName = styled.span`
  color: var(--color-text-secondary);
`;

const DimensionScore = styled.span`
  font-weight: bold;
  color: var(--color-text-primary);
`;

const Comment = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 0.9em;
  line-height: 1.5;
`;

interface ScoreDisplayProps {
  score: Score;
  judgeName?: string;
}

const dimensionNameMap: Record<string, string> = {
  logic: '逻辑性',
  personification: '拟人程度',
  compliance: '规则遵守',
};

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  judgeName
}) => {
  const formattedTimestamp = typeof score.timestamp === 'number' 
    ? formatTimestamp(convertNumberToTimestamp(score.timestamp))
    : formatTimestamp(score.timestamp);

  return (
    <Container
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <Title>
          评分详情
          {judgeName && <span style={{ color: 'var(--color-text-secondary)', marginLeft: 8 }}>
            - {judgeName}
          </span>}
          <div style={{ fontSize: '0.8em', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
            {formattedTimestamp}
          </div>
        </Title>
        <TotalScore>{score.totalScore}分</TotalScore>
      </Header>

      <DimensionList>
        {Object.entries(score.dimensions).map(([dimension, value]) => (
          <DimensionItem key={dimension}>
            <DimensionName>
              {dimensionNameMap[dimension] || dimension}
            </DimensionName>
            <DimensionScore>{value}分</DimensionScore>
          </DimensionItem>
        ))}
      </DimensionList>

      {score.comment && (
        <Comment>
          {score.comment}
        </Comment>
      )}
    </Container>
  );
}; 