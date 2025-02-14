import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import type { UnifiedPlayer, Score, Speech } from '../../types/adapters';
import { ScoreDisplay } from './ScoreDisplay';
import { formatTimestamp, convertToISOString } from '../../utils/timestamp';

// 样式定义
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-bg-white);
`;

const SpeechHistory = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const SpeechCard = styled(motion.div)<{ isCurrentSpeech: boolean }>`
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 8px;
  background-color: ${props => 
    props.isCurrentSpeech 
      ? 'var(--color-primary-light)' 
      : 'var(--color-bg-white)'
  };
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: var(--shadow-md);
  }
`;

const InnerThoughts = styled.div<{ isAI: boolean }>`
  padding: 12px 16px;
  margin: 8px 0;
  background-color: ${props => 
    props.isAI 
      ? 'var(--color-accent-light)' 
      : 'var(--color-bg-secondary)'
  };
  border-radius: 8px;
  font-style: italic;
  color: var(--color-text-secondary);
`;

interface SpeechAreaProps {
  speeches: Speech[];
  currentSpeech?: Speech;
  players: UnifiedPlayer[];
  onReference?: (speechId: string) => void;
  scores?: Record<string, Score[]>;
  judges?: Record<string, UnifiedPlayer>;
}

export const SpeechArea: React.FC<SpeechAreaProps> = ({
  speeches,
  currentSpeech,
  players,
  onReference,
  scores,
  judges
}) => {
  // 获取选手信息
  const getPlayer = (playerId: string) => {
    return players.find(p => p.id === playerId);
  };

  // 获取评委信息
  const getJudgeName = (judgeId: string) => {
    return judges?.[judgeId]?.name || judgeId;
  };

  return (
    <Container>
      <SpeechHistory>
        {speeches.map(speech => {
          const player = getPlayer(speech.playerId);
          const speechScores = scores?.[speech.id];
          
          return (
            <SpeechCard
              key={speech.id}
              isCurrentSpeech={speech.id === currentSpeech?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: 8 
              }}>
                <div style={{ fontWeight: 'bold' }}>
                  {player?.name || speech.playerId}
                </div>
                <div style={{ color: 'var(--color-text-secondary)' }}>
                  {formatTimestamp(speech.timestamp)}
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>{speech.content}</div>

              {speech.type === 'innerThoughts' && (
                <InnerThoughts isAI={player?.isAI || false}>
                  内心OS: {speech.content}
                </InnerThoughts>
              )}

              {speech.references && speech.references.length > 0 && (
                <div style={{ 
                  fontSize: '0.9em',
                  color: 'var(--color-text-secondary)',
                  marginTop: 8 
                }}>
                  引用了 {speech.references.length} 条发言
                </div>
              )}

              {speechScores?.map(score => (
                <ScoreDisplay
                  key={score.id}
                  score={score}
                  judgeName={getJudgeName(score.judgeId)}
                />
              ))}

              {onReference && (
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => onReference(speech.id)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '4px',
                      border: '1px solid var(--color-border)',
                      background: 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    引用此发言
                  </button>
                </div>
              )}
            </SpeechCard>
          );
        })}
      </SpeechHistory>
    </Container>
  );
}; 