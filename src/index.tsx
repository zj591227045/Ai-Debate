import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import 'reflect-metadata';
import { initializeProviders } from './modules/llm/services/initializeProviders';

// 初始化 LLM 服务提供者
initializeProviders();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
