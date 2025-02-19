import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import GameConfig from '../pages/GameConfig';
import { DebateRoom } from '../pages/DebateRoom';
import ScoringTest from '../pages/ScoringTest';
import { GameStart } from '../pages/GameStart';

const router = createBrowserRouter([
  {
    path: "/",
    element: <GameStart />,
  },
  {
    path: "/game-config",
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