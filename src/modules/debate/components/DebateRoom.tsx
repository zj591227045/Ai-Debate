import React, { useEffect } from 'react';
import { useDebateFlow } from '../hooks/useDebateFlow';
import type { DebateConfig } from '@game-config/types';
import { DebatePlayer } from './DebatePlayer';
import { SpeechDisplay } from './SpeechDisplay';
import { DebateControls } from './DebateControls';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';
import type { Speech, SpeechRole, SpeechType } from '@debate-flow/types/interfaces';

interface DebateRoomProps {
  config: DebateConfig;
}

export const DebateRoom: React.FC<DebateRoomProps> = ({ config }) => {
  const { state, error, actions } = useDebateFlow(config);

  useEffect(() => {
    if (error) {
      console.error('辩论流程错误:', error);
      // 可以添加错误提示UI
    }
  }, [error]);

  const handleStartDebate = async () => {
    await actions.startDebate();
  };

  const handlePauseDebate = async () => {
    await actions.pauseDebate();
  };

  const handleResumeDebate = async () => {
    await actions.resumeDebate();
  };

  const handleEndDebate = async () => {
    await actions.endDebate();
  };

  const handleSubmitSpeech = async (content: string) => {
    if (state?.currentSpeaker) {
      const role: SpeechRole = state.currentSpeaker.isAI ? 'assistant' : 'user';
      const type: SpeechType = 'speech';
      
      const speech: Speech = {
        id: crypto.randomUUID(),
        playerId: state.currentSpeaker.id,
        content,
        type,
        timestamp: Date.now(),
        round: state.currentRound,
        role
      };
      await actions.submitSpeech(speech);
    }
  };

  if (!state) {
    return <div>加载中...</div>;
  }

  return (
    <ErrorBoundary>
      <div className="debate-room">
        <header className="debate-room-header">
          <h1>{config.topic.title}</h1>
          <div className="debate-status">
            第 {state.currentRound} 轮 | {state.status}
          </div>
        </header>

        <main className="debate-room-main">
          <section className="debate-players">
            {config.players.map(player => (
              <DebatePlayer
                key={player.id}
                config={player}
                isCurrentSpeaker={state.currentSpeaker?.id === player.id}
                onSubmitSpeech={handleSubmitSpeech}
              />
            ))}
          </section>

          <section className="debate-content">
            {state.currentSpeech && (
              <SpeechDisplay
                speech={state.currentSpeech}
                speaker={state.currentSpeaker!}
              />
            )}
          </section>
        </main>

        <footer className="debate-room-footer">
          <DebateControls
            status={state.status}
            onStart={handleStartDebate}
            onPause={handlePauseDebate}
            onResume={handleResumeDebate}
            onEnd={handleEndDebate}
          />
        </footer>
      </div>
    </ErrorBoundary>
  );
}; 