import React from 'react';
import styled from '@emotion/styled';
import type { ScoreStatistics, PlayerRanking } from '../../types/adapters';

const Container = styled.div`
  padding: 16px;
  background: var(--color-bg-light);
  border-radius: 8px;
`;

const Title = styled.h4`
  margin: 0 0 16px 0;
  color: var(--color-text-primary);
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  padding: 12px;
  background: var(--color-bg-white);
  border-radius: 4px;
  border: 1px solid var(--color-border);
`;

const StatTitle = styled.div`
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 500;
  color: var(--color-text-primary);
`;

const DimensionStats = styled.div`
  margin-bottom: 24px;
`;

const DimensionTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 12px;
`;

const DimensionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

const RankingTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 8px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-weight: 500;
  font-size: 12px;
`;

const TableCell = styled.td`
  padding: 8px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
  font-size: 14px;
`;

interface ScoreStatisticsProps {
  statistics: ScoreStatistics;
  rankings: PlayerRanking[];
  getPlayerName: (playerId: string) => string;
}

export const ScoreStatisticsDisplay: React.FC<ScoreStatisticsProps> = ({
  statistics,
  rankings,
  getPlayerName
}) => {
  return (
    <Container>
      <Title>评分统计</Title>

      <StatGrid>
        <StatCard>
          <StatTitle>平均分</StatTitle>
          <StatValue>{statistics.overall.average.toFixed(1)}</StatValue>
        </StatCard>
        <StatCard>
          <StatTitle>最高分</StatTitle>
          <StatValue>{statistics.overall.highest.toFixed(1)}</StatValue>
        </StatCard>
      </StatGrid>

      <DimensionStats>
        <DimensionTitle>维度统计</DimensionTitle>
        <DimensionGrid>
          {Object.entries(statistics.dimensions).map(([dimension, stats]) => (
            <StatCard key={dimension}>
              <StatTitle>
                {dimension === 'logic' && '逻辑性'}
                {dimension === 'evidence' && '论据支持'}
                {dimension === 'delivery' && '表达能力'}
                {dimension === 'rebuttal' && '反驳能力'}
              </StatTitle>
              <StatValue>{stats.average.toFixed(1)}</StatValue>
              <div style={{ 
                fontSize: '12px', 
                color: 'var(--color-text-secondary)',
                marginTop: '4px' 
              }}>
                最高: {stats.highest} | 最低: {stats.lowest}
              </div>
            </StatCard>
          ))}
        </DimensionGrid>
      </DimensionStats>

      <div>
        <DimensionTitle>选手排名</DimensionTitle>
        <RankingTable>
          <thead>
            <tr>
              <TableHeader>排名</TableHeader>
              <TableHeader>选手</TableHeader>
              <TableHeader>平均分</TableHeader>
              <TableHeader>发言次数</TableHeader>
            </tr>
          </thead>
          <tbody>
            {rankings.map((ranking) => (
              <tr key={ranking.playerId}>
                <TableCell>{ranking.rank}</TableCell>
                <TableCell>{getPlayerName(ranking.playerId)}</TableCell>
                <TableCell>{ranking.averageScore.toFixed(1)}</TableCell>
                <TableCell>{ranking.speechCount}</TableCell>
              </tr>
            ))}
          </tbody>
        </RankingTable>
      </div>
    </Container>
  );
}; 