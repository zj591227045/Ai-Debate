import React from 'react';
import { Routes, Route } from 'react-router-dom';
import GameConfig from '../pages/GameConfig';
import { DebateRoom } from '../pages/DebateRoom';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<GameConfig />} />
      <Route path="/debate-room" element={<DebateRoom />} />
    </Routes>
  );
};

export default AppRoutes; 