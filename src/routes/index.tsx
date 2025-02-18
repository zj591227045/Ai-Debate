import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import GameConfig from '../pages/GameConfig';
import { DebateRoom } from '../pages/DebateRoom';
import ScoringTest from '../pages/ScoringTest';

const router = createBrowserRouter([
  {
    path: "/",
    element: <GameConfig />,
  },
  {
    path: "/debate-room",
    element: <DebateRoom />,
  },
  {
    path: "test/scoring",
    element: <ScoringTest />
  },
]);

export default router; 