import React from 'react';
import styled from '@emotion/styled';
import type { Score } from '../../types/adapters';

const Container = styled.div`
  padding: 16px;
  background: var(--color-bg-light);
  border-radius: 8px;
  margin-top: 12px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Title = styled.h4`
  margin: 0;
  color: var(--color-text-primary);
`;

const TotalScore = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: var(--color-primary);
`;

const DimensionScores = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
`;

const DimensionScore = styled.div`
  padding: 8px;
  background: var(--color-bg-white);
  border-radius: 4px;
  border: 1px solid var(--color-border);
`;

const DimensionName = styled.div`
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
`;

const ScoreValue = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-primary);
`;

const Feedback = styled.div`
  margin-top: 16px;
`;

const FeedbackSection = styled.div`
  margin-bottom: 12px;
`;

const FeedbackTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 8px;
`;

const FeedbackList = styled.ul`
  margin: 0;
  padding-left: 20px;
  color: var(--color-text-secondary);
`;

const Comment = styled.div`
  margin-top: 16px;
  padding: 12px;
  background: var(--color-bg-white);
  border-radius: 4px;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-style: italic;
`;

interface ScoreDisplayProps {
  score: Score;
  judgeName: string;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, judgeName }) => {
  return (
    <Container>
      <Header>
        <Title>{judgeName}的评分</Title>
        <TotalScore>{score.totalScore.toFixed(1)}分</TotalScore>
      </Header>

      <DimensionScores>
        {Object.entries(score.dimensions).map(([dimension, value]) => (
          <DimensionScore key={dimension}>
            <DimensionName>
              {dimension === 'logic' && '逻辑性'}
              {dimension === 'evidence' && '论据支持'}
              {dimension === 'delivery' && '表达能力'}
              {dimension === 'rebuttal' && '反驳能力'}
            </DimensionName>
            <ScoreValue>{value}分</ScoreValue>
          </DimensionScore>
        ))}
      </DimensionScores>

      <Feedback>
        <FeedbackSection>
          <FeedbackTitle>优点</FeedbackTitle>
          <FeedbackList>
            {score.feedback.strengths.map((strength: string, index: number) => (
              <li key={index}>{strength}</li>
            ))}
          </FeedbackList>
        </FeedbackSection>

        <FeedbackSection>
          <FeedbackTitle>不足</FeedbackTitle>
          <FeedbackList>
            {score.feedback.weaknesses.map((weakness: string, index: number) => (
              <li key={index}>{weakness}</li>
            ))}
          </FeedbackList>
        </FeedbackSection>

        <FeedbackSection>
          <FeedbackTitle>建议</FeedbackTitle>
          <FeedbackList>
            {score.feedback.suggestions.map((suggestion: string, index: number) => (
              <li key={index}>{suggestion}</li>
            ))}
          </FeedbackList>
        </FeedbackSection>
      </Feedback>

      {score.comment && (
        <Comment>{score.comment}</Comment>
      )}
    </Container>
  );
}; 