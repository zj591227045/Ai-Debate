import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DebateRoom from '../pages/DebateRoom';

export const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/debate-room" element={<DebateRoom />} />
        <Route path="/" element={<Navigate to="/debate-room" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes; 