import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import router from './routes';
import { moduleEventBus } from './modules/llm/services/events';
import { initializeContainer } from './modules/llm/services/container';
import { StoreManager } from './modules/state/core/StoreManager';
import { EventBus } from './modules/state/core/EventBus';
import './App.css';

const App: React.FC = () => {
  useEffect(() => {
    const initialize = async () => {
      try {
        const storeManager = StoreManager.getInstance();
        const eventBus = EventBus.getInstance();
        await storeManager.hydrateAll();
        await initializeContainer(eventBus);
      } catch (error) {
        console.error('初始化失败:', error);
      }
    };

    initialize();
  }, []);

  return (
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
};

export default App;