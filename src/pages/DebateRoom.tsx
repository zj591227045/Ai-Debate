import React from 'react';
import styled from '@emotion/styled';
import { DebateRoomLayout } from '../components/debate/DebateRoomLayout';
import { Header } from '../components/debate/Header';
import { PlayerList } from '../components/debate/PlayerList';
import { MainContent } from '../components/debate/MainContent';
import { ControlPanel } from '../components/debate/ControlPanel';
import { useDebateControl } from '../hooks/debate/useDebateControl';
import type { Player } from '../types';

const Container = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

export const DebateRoom: React.FC = () => {
  const {
    state: debateState,
    startDebate,
    pauseDebate,
    resumeDebate,
    endDebate,
    isActive,
    duration
  } = useDebateControl({
    totalRounds: 4,
    onStatusChange: (status) => {
      console.log('辩论状态变更:', status);
    },
    onRoundChange: (round) => {
      console.log('当前回合:', round);
    }
  });

  const [currentSpeaker, setCurrentSpeaker] = React.useState<string>();
  const [speakingOrder, setSpeakingOrder] = React.useState<string[]>([]);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = React.useState<number>(0);

  // 随机生成发言顺序
  const generateRandomOrder = () => {
    return [...players].sort(() => Math.random() - 0.5);
  };

  const [players, setPlayers] = React.useState<Player[]>([
    {
      id: '1',
      name: '正方一辩',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player1',
      role: 'for',
      score: 85,
      isActive: false
    },
    {
      id: '2',
      name: '正方二辩',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player2',
      role: 'for',
      score: 82,
      isActive: false
    },
    {
      id: '3',
      name: '反方一辩',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player3',
      role: 'against',
      score: 88,
      isActive: false
    },
    {
      id: '4',
      name: '反方二辩',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player4',
      role: 'against',
      score: 86,
      isActive: false
    }
  ]);

  const handleSpeechAdded = (speech: any) => {
    console.log('新增发言:', speech);
  };

  const handleSpeechEdited = (speech: any) => {
    console.log('编辑发言:', speech);
  };

  const handleStart = () => {
    const randomizedPlayers = generateRandomOrder();
    const speakerNames = randomizedPlayers.map(p => p.name);
    setSpeakingOrder(speakerNames);
    setCurrentSpeakerIndex(0);
    setCurrentSpeaker(speakerNames[0]);
    setPlayers(randomizedPlayers.map((p, index) => ({
      ...p,
      isActive: index === 0
    })));
    startDebate();
  };

  const handleNextSpeaker = () => {
    const nextIndex = (currentSpeakerIndex + 1) % players.length;
    setCurrentSpeakerIndex(nextIndex);
    setCurrentSpeaker(speakingOrder[nextIndex]);
    setPlayers(prev => prev.map((p, index) => ({
      ...p,
      isActive: p.name === speakingOrder[nextIndex]
    })));
  };

  const handleEnd = () => {
    setCurrentSpeaker(undefined);
    setCurrentSpeakerIndex(0);
    setSpeakingOrder([]);
    setPlayers(prev => prev.map(p => ({
      ...p,
      isActive: false
    })));
    endDebate();
  };

  const canNextSpeaker: boolean = !!(isActive && currentSpeaker && debateState.status !== 'paused');

  return (
    <Container>
      <DebateRoomLayout
        header={
          <Header
            topic="辩题：人工智能是否会取代人类工作？"
            currentRound={debateState.currentRound}
            totalRounds={debateState.totalRounds}
            timeLeft={duration}
          />
        }
        players={
          <PlayerList 
            players={players}
          />
        }
        main={
          <MainContent
            players={players}
            currentSpeaker={currentSpeaker}
            onSpeechAdded={handleSpeechAdded}
            onSpeechEdited={handleSpeechEdited}
          />
        }
        control={
          <ControlPanel
            isDebating={debateState.status !== 'preparing' && debateState.status !== 'finished'}
            isPaused={debateState.status === 'paused'}
            onStart={handleStart}
            onPause={pauseDebate}
            onResume={resumeDebate}
            onEnd={handleEnd}
            onNextSpeaker={handleNextSpeaker}
            canNextSpeaker={canNextSpeaker}
          />
        }
      />
    </Container>
  );
}

export default DebateRoom; 