import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Global, css } from '@emotion/react';
import { ThemeProvider } from './styles/ThemeContext';
import GameStart from './pages/GameStart';
import GameConfig from './pages/GameConfig';
import DebateRoom from './pages/DebateRoom';

const globalStyles = css`
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: all 0.3s ease;
  }

  * {
    box-sizing: border-box;
  }
`;

function App() {
  return (
    <ThemeProvider>
      <Global styles={globalStyles} />
      <Router>
        <Routes>
          <Route path="/" element={<GameStart />} />
          <Route path="/game-config" element={<GameConfig />} />
          <Route path="/debate-room" element={<DebateRoom />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;