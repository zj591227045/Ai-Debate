import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Global, css } from '@emotion/react';
import { ThemeProvider } from './styles/ThemeContext';
import DebateRoom from './pages/DebateRoom';
import DebateTest from './pages/DebateTest';

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
          <Route path="/" element={<DebateRoom />} />
          <Route path="/test" element={<DebateTest />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;