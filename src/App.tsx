import React, { useEffect, useState } from 'react';
import { RouterProvider, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import router from './routes';
import { moduleEventBus } from './modules/llm/services/events';
import { initializeContainer } from './modules/llm/services/container';
import { StoreManager } from './modules/state/core/StoreManager';
import { EventBus } from './modules/state/core/EventBus';
import { ThemeProvider } from './styles/ThemeContext';
import './App.css';
import ScoringTest from './pages/ScoringTest';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const storeManager = StoreManager.getInstance();
        const eventBus = EventBus.getInstance();
        
        // 等待所有状态恢复完成
        await storeManager.hydrateAll();
        await initializeContainer(eventBus);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('初始化失败:', error);
      }
    };

    initialize();
  }, []);

  if (!isInitialized) {
    return <div>正在加载...</div>;
  }

  return (
    <ThemeProvider>
      <ConfigProvider locale={zhCN}>
        <RouterProvider router={router} />
      </ConfigProvider>
    </ThemeProvider>
  );
};

export default App;