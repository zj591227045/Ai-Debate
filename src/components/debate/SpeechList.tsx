import React, { useRef, useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { SpeechRecord } from './SpeechRecord';
import type { BaseDebateSpeech, UnifiedPlayer } from '../../types/adapters';
import type { CharacterConfig } from '../../modules/character/types';

interface SpeechListProps {
  players: UnifiedPlayer[];
  currentSpeakerId?: string;
  speeches: BaseDebateSpeech[];
  onReference?: (speechId: string) => void;
  getReferencedSpeeches?: (speechId: string) => BaseDebateSpeech[];
  streamingSpeech?: {
    playerId: string;
    content: string;
    type: 'speech' | 'innerThoughts' | 'system';
  };
  characterConfigs?: Record<string, CharacterConfig>;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  scroll-behavior: smooth;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.02);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
  }
`;

const NoSpeeches = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: rgba(0, 0, 0, 0.45);
  font-size: 16px;
`;

export const SpeechList: React.FC<SpeechListProps> = ({
  players,
  currentSpeakerId,
  speeches,
  onReference,
  getReferencedSpeeches,
  streamingSpeech,
  characterConfigs
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const lastContentRef = useRef<string>('');

  const getPlayerInfo = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) {
      return {
        name: playerId,
        avatar: undefined,
        characterName: undefined,
        modelInfo: undefined
      };
    }

    // 处理AI角色信息
    if (player.isAI && player.characterId && characterConfigs) {
      // 获取角色配置
      const character = characterConfigs[player.characterId];
      
      if (character) {
        // 获取模型信息
        const modelInfo = character.callConfig?.direct?.model || 'AI助手';
        
        return {
          name: player.name,
          avatar: player.avatar || character.avatar,
          characterName: character.name || player.name,
          modelInfo
        };
      }
    }
    
    // 处理人类玩家信息或没有角色配置的AI玩家
    return {
      name: player.name,
      avatar: player.avatar,
      characterName: undefined,
      modelInfo: player.isAI ? 'AI助手' : undefined
    };
  };

  // 处理滚动事件
  const handleScroll = () => {
    if (!containerRef.current || isUserScrolling) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    setShouldAutoScroll(isAtBottom);
  };

  // 处理用户滚动
  const handleUserScroll = () => {
    if (!isUserScrolling) {
      setIsUserScrolling(true);
      setTimeout(() => setIsUserScrolling(false), 150); // 防抖
    }
  };

  // 滚动到底部
  const scrollToBottom = () => {
    if (containerRef.current && shouldAutoScroll && !isUserScrolling) {
      const { scrollHeight, clientHeight } = containerRef.current;
      containerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  };

  // 监听内容变化
  useEffect(() => {
    const currentContent = streamingSpeech?.content || '';
    if (currentContent !== lastContentRef.current) {
      lastContentRef.current = currentContent;
      scrollToBottom();
    }
  }, [streamingSpeech?.content]);

  // 监听新消息
  useEffect(() => {
    if (speeches.length > 0) {
      scrollToBottom();
    }
  }, [speeches.length]);

  // 添加滚动事件监听
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      container.addEventListener('wheel', handleUserScroll);
      container.addEventListener('touchmove', handleUserScroll);

      return () => {
        container.removeEventListener('scroll', handleScroll);
        container.removeEventListener('wheel', handleUserScroll);
        container.removeEventListener('touchmove', handleUserScroll);
      };
    }
  }, []);

  return (
    <Container ref={containerRef}>
      <AnimatePresence>
        {speeches.length === 0 && !streamingSpeech ? (
          <NoSpeeches>暂无发言记录</NoSpeeches>
        ) : (
          <>
            {speeches.map((speech) => {
              const playerInfo = getPlayerInfo(speech.playerId);
              return (
                <motion.div
                  key={speech.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SpeechRecord
                    key={speech.id}
                    speaker={playerInfo.name}
                    content={speech.content}
                    timestamp={speech.timestamp}
                    isCurrentSpeaker={speech.playerId === currentSpeakerId}
                    onReference={() => onReference?.(speech.id)}
                    referencedSpeeches={getReferencedSpeeches?.(speech.id)}
                    type={speech.type}
                    avatar={playerInfo.avatar}
                    characterName={playerInfo.characterName}
                    modelInfo={playerInfo.modelInfo}
                  />
                </motion.div>
              );
            })}
            {streamingSpeech && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SpeechRecord
                  speaker={getPlayerInfo(streamingSpeech.playerId).name}
                  content={streamingSpeech.content}
                  timestamp={new Date().toISOString()}
                  isCurrentSpeaker={streamingSpeech.playerId === currentSpeakerId}
                  streaming
                  type={streamingSpeech.type}
                  avatar={getPlayerInfo(streamingSpeech.playerId).avatar}
                  characterName={getPlayerInfo(streamingSpeech.playerId).characterName}
                  modelInfo={getPlayerInfo(streamingSpeech.playerId).modelInfo}
                />
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </Container>
  );
}; 