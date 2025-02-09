import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Global, css } from '@emotion/react';
import { ThemeProvider } from './styles/ThemeContext';
import { ModelProvider } from './modules/model/context/ModelContext';
import AppRoutes from './routes';
import './App.css';
import { Provider } from 'react-redux';
import { store } from './store';
import { DebateProvider } from './contexts/DebateContext';
import { moduleEventBus } from './modules/llm/services/events';
import { moduleStore } from './modules/llm/services/store';
import { initializeContainer } from './modules/llm/services/container';
import { StoreManager } from './modules/store/StoreManager';

const globalStyles = css`
  :root {
    --color-primary: #1890ff;
    --color-primary-light: #e6f7ff;
    --color-success: #52c41a;
    --color-warning: #faad14;
    --color-error: #f5222d;
    --color-bg-white: #ffffff;
    --color-bg-light: #f5f5f5;
    --color-bg-hover: #f0f0f0;
    --color-text-primary: #000000;
    --color-text-secondary: #666666;
    --color-border: #e8e8e8;
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
      'Noto Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: 1.5;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
`;

const App: React.FC = () => {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 初始化存储管理器
        const storeManager = StoreManager.getInstance();
        await storeManager.initialize();
        
        // 初始化 LLM 服务容器
        initializeContainer(moduleEventBus, moduleStore);
        
        console.log('应用初始化完成');
      } catch (error) {
        console.error('应用初始化失败:', error);
      }
    };
    
    initializeApp();
  }, []);

  return (
    <Provider store={store}>
      <DebateProvider>
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
      </DebateProvider>
    </Provider>
  );
};

export default App;