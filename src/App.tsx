import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Global, css } from '@emotion/react';
import { ThemeProvider } from './styles/ThemeContext';
import { ModelProvider } from './modules/model/context/ModelContext';
import AppRoutes from './routes';
import './App.css';

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
    <BrowserRouter>
      <ModelProvider>
        <ThemeProvider>
          <Global styles={globalStyles} />
          <div className="app">
            <AppRoutes />
          </div>
        </ThemeProvider>
      </ModelProvider>
    </BrowserRouter>
  );
}

export default App;