import React, { createContext, useContext, useState } from 'react';
import type { GameConfigState } from '../types/adapters';

interface DebateContextType {
  gameConfig: GameConfigState | null;
  setGameConfig: (config: GameConfigState) => void;
  validateConfig?: (config: GameConfigState) => boolean;
}

const DebateContext = createContext<DebateContextType>({
  gameConfig: null,
  setGameConfig: () => {},
});

export const DebateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameConfig, setGameConfig] = useState<GameConfigState | null>(null);

  // 预留的配置验证方法
  const validateConfig = (config: GameConfigState): boolean => {
    // TODO: 实现配置验证
    return true;
  };

  return (
    <DebateContext.Provider value={{ gameConfig, setGameConfig, validateConfig }}>
      {children}
    </DebateContext.Provider>
  );
};

export const useDebate = () => {
  const context = useContext(DebateContext);
  if (!context) {
    throw new Error('useDebate must be used within a DebateProvider');
  }
  return context;
}; 