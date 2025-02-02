import React from 'react';
import { Routes, Route } from 'react-router-dom';
import GameStart from '../pages/GameStart';
import GameConfig from '../pages/GameConfig';
import DebateRoom from '../pages/DebateRoom';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<GameStart />} />
      <Route path="/game-config" element={<GameConfig />} />
      <Route path="/debate-room" element={<DebateRoom />} />
    </Routes>
  );
};

export default AppRoutes; 