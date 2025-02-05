import React, { useEffect } from 'react';
import { useAIDebate } from '../hooks/useAIDebate';
import type { DebateRoomProps } from '../types/debate';
import type { Character } from '../types/character';

export const DebateRoom: React.FC<DebateRoomProps> = ({ state, onStateChange }) => {
  const { isGenerating, generateInnerThoughts, generateSpeech, generateScore, error } = useAIDebate();
  
  const handleAITurn = async (character: Character) => {
    if (!character.isAI) return;
    
    try {
      // 生成内心OS
      const innerThoughts = await generateInnerThoughts(character, state);
      
      // 更新状态
      onStateChange({
        ...state,
        innerThoughts: {
          ...state.innerThoughts,
          [character.id]: innerThoughts
        }
      });
      
      // 生成正式发言
      const speech = await generateSpeech(character, state, innerThoughts);
      
      // 更新状态
      onStateChange({
        ...state,
        speeches: [
          ...state.speeches,
          {
            playerId: character.id,
            content: speech,
            round: state.currentRound,
            timestamp: new Date().toISOString()
          }
        ]
      });
      
      // 如果当前角色是裁判，生成评分
      if (character.role === 'judge') {
        const score = await generateScore(character, state);
        onStateChange({
          ...state,
          scores: [
            ...state.scores,
            {
              judgeId: character.id,
              content: score,
              round: state.currentRound,
              timestamp: new Date().toISOString()
            }
          ]
        });
      }
    } catch (err) {
      console.error('AI回合处理失败:', err);
      // 这里可以添加错误提示UI
    }
  };

  // 监听当前发言者变化
  useEffect(() => {
    const currentSpeaker = state.players.find((p: Character) => p.id === state.currentSpeakerId);
    if (currentSpeaker?.isAI) {
      handleAITurn(currentSpeaker);
    }
  }, [state.currentSpeakerId]);

  return (
    <div className="debate-room">
      {/* ... existing code ... */}
      
      {/* 添加加载状态显示 */}
      {isGenerating && (
        <div className="ai-generating-indicator">
          AI正在思考中...
        </div>
      )}
      
      {/* 添加错误提示 */}
      {error && (
        <div className="ai-error-message">
          {error.message}
        </div>
      )}
      
      {/* ... existing code ... */}
    </div>
  );
}; 