import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useRoundManager } from '../hooks/debate/useRoundManager';
import { RoundProgress } from '../components/debate/RoundProgress';
import { EliminationAnnouncement } from '../components/debate/EliminationAnnouncement';

const Container = styled.div`
  padding: ${props => props.theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const ControlPanel = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.radius.md};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.md};
  transition: background-color ${props => props.theme.transitions.fast};

  &:hover {
    background-color: ${props => props.theme.colors.primaryDark};
  }

  &:disabled {
    background-color: ${props => props.theme.colors.text.tertiary};
    cursor: not-allowed;
  }
`;

const ScoreInput = styled.input`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.radius.md};
  width: 100px;
`;

const PlayerInfo = styled.div`
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.radius.md};
`;

const testPlayers = [
  { id: '1', name: '选手A', role: 'for' },
  { id: '2', name: '选手B', role: 'against' },
  { id: '3', name: '选手C', role: 'for' },
  { id: '4', name: '选手D', role: 'against' },
];

const DebateTest: React.FC = () => {
  const [showElimination, setShowElimination] = useState(false);
  const [eliminatedPlayers, setEliminatedPlayers] = useState<any[]>([]);
  const [currentScore, setCurrentScore] = useState<string>('');

  const {
    state,
    startRound,
    pauseRound,
    resumeRound,
    endRound,
    nextSpeaker,
    addScore
  } = useRoundManager({
    config: {
      type: 'free',
      totalRounds: 3,
      playerCount: 4,
      eliminationRules: {
        enabled: true,
        eliminatePerRound: 1,
        minPlayers: 2,
        tiebreaker: {
          criteria: ['averageScore', 'totalScore'],
          random: true
        }
      }
    },
    players: testPlayers,
    onRoundEnd: (result) => {
      console.log('轮次结束：', result);
    },
    onPlayerEliminated: (player) => {
      console.log('选手淘汰：', player);
      setEliminatedPlayers([{
        playerId: player.id,
        name: testPlayers.find(p => p.id === player.id)?.name || '',
        reason: player.reason,
        rank: player.rank
      }]);
      setShowElimination(true);
    }
  });

  const handleAddScore = () => {
    if (state.currentSpeaker && currentScore) {
      addScore(state.currentSpeaker, Number(currentScore));
      setCurrentScore('');
    }
  };

  return (
    <Container>
      <h1>辩论测试页面</h1>
      
      <RoundProgress
        currentRound={state.currentRound}
        totalRounds={3}
        currentSpeaker={state.currentSpeaker ? 
          testPlayers.find(p => p.id === state.currentSpeaker)?.name : 
          undefined}
        speakingOrder={state.speakingOrder.map(id => 
          testPlayers.find(p => p.id === id)?.name || '')}
        completedSpeeches={state.completedSpeeches.length}
        totalSpeeches={testPlayers.length}
      />

      <PlayerInfo>
        <h3>当前发言顺序：</h3>
        {state.speakingOrder.map((id, index) => (
          <div key={id}>
            {index + 1}. {testPlayers.find(p => p.id === id)?.name}
            {id === state.currentSpeaker && ' (当前发言)'}
          </div>
        ))}
      </PlayerInfo>

      <ControlPanel>
        <Button 
          onClick={startRound}
          disabled={state.status !== 'preparing' && state.status !== 'finished'}
        >
          开始新轮次
        </Button>
        
        <Button 
          onClick={pauseRound}
          disabled={state.status !== 'speaking'}
        >
          暂停
        </Button>
        
        <Button 
          onClick={resumeRound}
          disabled={state.status !== 'paused'}
        >
          继续
        </Button>
        
        <Button 
          onClick={nextSpeaker}
          disabled={!state.currentSpeaker || state.status !== 'speaking'}
        >
          下一位发言
        </Button>
        
        <Button 
          onClick={endRound}
          disabled={state.status !== 'speaking' && state.status !== 'paused'}
        >
          结束本轮
        </Button>

        <div>
          <ScoreInput
            type="number"
            min="0"
            max="100"
            value={currentScore}
            onChange={(e) => setCurrentScore(e.target.value)}
            placeholder="输入分数"
          />
          <Button 
            onClick={handleAddScore}
            disabled={!state.currentSpeaker || !currentScore}
          >
            提交分数
          </Button>
        </div>
      </ControlPanel>

      <EliminationAnnouncement
        show={showElimination}
        eliminatedPlayers={eliminatedPlayers}
        onClose={() => setShowElimination(false)}
      />
    </Container>
  );
};

export default DebateTest; 