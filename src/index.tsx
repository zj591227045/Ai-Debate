import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import 'reflect-metadata';
import { initializeProviders } from './modules/llm/services/initializeProviders';

// 禁用自动填充功能
if (typeof window !== 'undefined') {
  // 禁用自动填充
  (window as any).__disableAutofill = true;
  (window as any).__disableAutofillOverlay = true;
  (window as any).__disableBootstrapLegacyAutofill = true;
  
  // 移除已存在的相关脚本
  document.querySelectorAll('script[src*="autofill"]').forEach(script => script.remove());
  
  // 阻止相关事件
  window.addEventListener('load', () => {
    document.querySelectorAll('input, textarea').forEach(element => {
      element.setAttribute('autocomplete', 'off');
      element.setAttribute('data-form-type', 'other');
    });
  });
}

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
