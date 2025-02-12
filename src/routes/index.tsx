import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import GameConfig from '../pages/GameConfig';
import { DebateRoom } from '../pages/DebateRoom';

const router = createBrowserRouter([
  {
    path: "/",
    element: <GameConfig />,
  },
  {
    path: "/debate-room",
    element: <DebateRoom />,
  },
]);

export default router; 