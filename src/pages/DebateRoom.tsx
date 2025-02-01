import React from 'react';
import styled from '@emotion/styled';
import { useLocation, useNavigate } from 'react-router-dom';
import { DebateRoomLayout } from '../components/debate/DebateRoomLayout';
import { Header } from '../components/debate/Header';
import { TopToolbar } from '../components/debate/TopToolbar';
import { PlayerList } from '../components/debate/PlayerList';
import { MainContent } from '../components/debate/MainContent';
import { ControlPanel } from '../components/debate/ControlPanel';
import { useDebateControl } from '../hooks/debate/useDebateControl';
import type { Player } from '../types';
import SpeechList from '../components/debate/SpeechList';
import type { Speech } from '../hooks/debate/useSpeechRecorder';

const Container = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme.colors.background.default};
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-top: 48px; // 为顶部工具栏留出空间
`;

const defaultRules = [
  '每位选手发言时间不超过3分钟',
  '发言需要针对对方上一轮的论点进行回应',
  '禁止人身攻击和过激言论',
];

export const DebateRoom: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 添加调试信息
  console.log('DebateRoom - 接收到的状态:', location.state);

  const [topicDescription] = React.useState(
    '随着人工智能技术的快速发展，其对人类工作岗位的影响日益显著。本场辩论将探讨AI是否会在未来取代人类的工作岗位，以及这种变革对社会的影响。'
  );

  const [currentRound, setCurrentRound] = React.useState(1);
  const [totalRounds] = React.useState(4);
  const [isRulesExpanded, setIsRulesExpanded] = React.useState(true);

  const handlePlayerClick = (playerId: string) => {
    console.log('点击选手:', playerId);
  };

  // 如果没有玩家配置，重定向到配置页面
  React.useEffect(() => {
    if (!location.state?.players) {
      console.log('DebateRoom - 未接收到玩家配置，重定向到配置页面');
      navigate('/game-config');
    }
  }, [location.state, navigate]);

  const {
    state: debateState,
    startDebate,
    pauseDebate,
    resumeDebate,
    endDebate,
    isActive,
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

  const [speeches, setSpeeches] = React.useState<Speech[]>([]);

  // 将配置页面传递的玩家数据转换为辩论室需要的格式
  const convertConfigPlayers = (configPlayers: any[]): Player[] => {
    return configPlayers.map(p => ({
      id: p.id,
      name: p.name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
      role: p.role.startsWith('affirmative') ? 'for' : 'against',
      score: 0,
      isActive: false,
      isAI: p.isAI
    }));
  };

  // 使用配置页面传递的玩家数据或默认数据
  const [players, setPlayers] = React.useState<Player[]>(() => {
    if (location.state?.players) {
      console.log('DebateRoom - 使用配置页面传递的玩家数据');
      return convertConfigPlayers(location.state.players);
    }
    console.log('DebateRoom - 使用默认玩家数据');
    return [
      {
        id: '1',
        name: '正方一辩',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player1',
        role: 'for',
        score: 0,
        isActive: false,
        isAI: true
      },
      {
        id: '2',
        name: '正方二辩',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player2',
        role: 'for',
        score: 0,
        isActive: false,
        isAI: true
      },
      {
        id: '3',
        name: '反方一辩',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player3',
        role: 'against',
        score: 0,
        isActive: false,
        isAI: true
      },
      {
        id: '4',
        name: '反方二辩',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player4',
        role: 'against',
        score: 0,
        isActive: false,
        isAI: true
      }
    ];
  });

  // 随机生成发言顺序
  const generateRandomOrder = () => {
    return [...players].sort(() => Math.random() - 0.5);
  };

  const handleSpeechAdded = (speech: Speech) => {
    console.log('新增发言:', speech);
    setSpeeches(prev => [...prev, speech]);
  };

  const handleSpeechEdited = (speech: Speech) => {
    console.log('编辑发言:', speech);
    setSpeeches(prev => prev.map(s => s.id === speech.id ? speech : s));
  };

  const getReferencedSpeeches = (speechId: string): Speech[] => {
    const speech = speeches.find(s => s.id === speechId);
    if (!speech?.references?.length) return [];
    return speeches.filter(s => speech.references?.includes(s.id));
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

  const handleBackToConfig = () => {
    // 如果辩论正在进行，先确认是否要返回
    if (debateState.status !== 'preparing' && debateState.status !== 'finished') {
      if (!window.confirm('辩论正在进行中，确定要返回配置页面吗？')) {
        return;
      }
      // 结束当前辩论
      handleEnd();
    }
    // 返回配置页面时，传递当前的配置
    navigate('/game-config', {
      state: {
        lastConfig: location.state
      }
    });
  };

  const canNextSpeaker: boolean = !!(isActive && currentSpeaker && debateState.status !== 'paused');

  if (!location.state?.players) {
    return null; // 等待重定向
  }

  return (
    <Container>
      <TopToolbar onBack={handleBackToConfig} />
      <ContentContainer>
        <DebateRoomLayout
          header={
            <Header
              topic="人工智能是否会取代人类工作？"
              topicDescription={topicDescription}
              currentRound={currentRound}
              totalRounds={totalRounds}
              rules={defaultRules}
              onRulesExpandChange={setIsRulesExpanded}
            />
          }
          players={
            <PlayerList 
              players={players}
              currentSpeaker={currentSpeaker}
              onPlayerClick={handlePlayerClick}
            />
          }
          main={
            <SpeechList
              players={players}
              currentSpeakerId={currentSpeaker}
              speeches={speeches}
              onReference={(speechId) => console.log('引用发言:', speechId)}
              getReferencedSpeeches={getReferencedSpeeches}
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
          isRulesExpanded={isRulesExpanded}
        />
      </ContentContainer>
    </Container>
  );
}

export default DebateRoom; 