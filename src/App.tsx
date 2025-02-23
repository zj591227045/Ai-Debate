import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { SpeedInsights } from '@vercel/speed-insights/react';
import router from './routes';
import { initializeContainer } from './modules/llm/services/container';
import { StoreManager } from './modules/state/core/StoreManager';
import { EventBus } from './modules/state/core/EventBus';
import { ThemeProvider } from './styles/ThemeContext';
import './App.css';

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
        <SpeedInsights />
      </ConfigProvider>
    </ThemeProvider>
  );
};

export default App;