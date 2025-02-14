import React from 'react';
import styled from '@emotion/styled';
import type { DebateRoomLayout, Speech, Score } from '../../../types/adapters';
import { formatTimestamp } from '../../../utils/timestamp';

type ContentComponents = DebateRoomLayout['regions']['content']['components'];
type ContentStyle = DebateRoomLayout['regions']['content']['style'];

interface SpeechScore {
  id: string;
  dimensions: Record<string, number>;
  comment?: string;
  totalScore: number;
}

// 内容区域容器
const ContentContainer = styled.div<{ style: ContentStyle }>`
  display: flex;
  flex-direction: column;
  ${props => ({ ...props.style })}
`;

// 发言历史
const SpeechHistory = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
`;

// 发言卡片
const SpeechCard = styled.div<{ isCurrentSpeech: boolean }>`
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 8px;
  background-color: ${props => 
    props.isCurrentSpeech 
      ? 'var(--color-primary-light)' 
      : 'var(--color-bg-white)'
  };
  border: 1px solid var(--color-border);
`;

// 内心OS面板
const InnerThoughts = styled.div`
  padding: 16px;
  margin: 16px 0;
  background-color: var(--color-bg-secondary);
  border-radius: 8px;
  font-style: italic;
`;

// 评论区域
const Comments = styled.div`
  padding: 16px;
  background-color: var(--color-bg-light);
`;

interface ContentRegionProps {
  components: ContentComponents;
  style: ContentStyle;
}

export const ContentRegion: React.FC<ContentRegionProps> = ({
  components,
  style
}) => {
  const { speechHistory = [], currentSpeech, innerThoughts, judgeComments = [] } = components;

  return (
    <ContentContainer style={style}>
      <SpeechHistory>
        {speechHistory.map(speech => (
          <SpeechCard
            key={speech.id}
            isCurrentSpeech={speech.id === currentSpeech?.id}
          >
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 'bold' }}>
                {speech.playerId} - {formatTimestamp(speech.timestamp)}
              </span>
              {speech.references.length > 0 && (
                <span style={{ marginLeft: 8, color: 'var(--color-text-secondary)' }}>
                  引用了 {speech.references.length} 条发言
                </span>
              )}
            </div>
            <div style={{ marginBottom: 8 }}>{speech.content}</div>
            {speech.scores?.map(score => (
              <div 
                key={score.id}
                style={{ 
                  marginTop: 8,
                  padding: 8,
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderRadius: 4
                }}
              >
                <div>评分: {(score as SpeechScore).totalScore}</div>
                <div>评语: {score.comment}</div>
                <div>
                  维度得分:
                  {Object.entries(score.dimensions).map(([dimension, score]) => (
                    <span key={dimension} style={{ marginLeft: 8 }}>
                      {dimension}: {score}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </SpeechCard>
        ))}
      </SpeechHistory>

      {currentSpeech && (
        <div style={{ padding: 16, backgroundColor: 'var(--color-primary-light)' }}>
          <h3>当前发言</h3>
          <div>{currentSpeech.content}</div>
        </div>
      )}

      {innerThoughts && (
        <InnerThoughts>
          当前内心OS: {innerThoughts}
        </InnerThoughts>
      )}

      {judgeComments.length > 0 && (
        <Comments>
          <h3>评委点评</h3>
          {judgeComments.map((comment, index) => (
            <div 
              key={index}
              style={{ 
                marginBottom: 12,
                padding: 12,
                backgroundColor: 'var(--color-bg-white)',
                borderRadius: 8
              }}
            >
              {comment}
            </div>
          ))}
        </Comments>
      )}
    </ContentContainer>
  );
}; 